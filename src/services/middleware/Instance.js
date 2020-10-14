const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema'),
    instanceTools = require('../tools/instance'),
    moment = require('moment'),
    socketService = require('../tools/socket'),
    CronJob = require('cron').CronJob;

module.exports = {
    startWorkflow: async (req, res, next) => {
        try {

            let workflowType = ''

            if (_.includes(req.path, '/return-workflow/')) {
                workflowType = 'returnWorkflow'
            } else if (_.includes(req.path, '/queue-workflow/')) {
                workflowType = 'queueWorkflow'
            } else if (_.includes(req.path, '/schedule-workflow/')) {
                workflowType = 'scheduleWorkflow'
            } else {
                return res.status(500).send('Workflow type not found')
            }

            const workflowTypeCount = `${workflowType}Count`
            const workflowTypeLast = `${workflowType}Last`

            // Find Queue
            const workflow = await IndexSchema.Workflow.findById(req.params.workflowId)
            if (!workflow) return res.status(500).send('Workflow not found')

            // Check Account Type
            const billing = await IndexSchema.Billing.findOne({ sub: req.user.sub })
            if (!billing || !billing.accountType) return res.status(500).send('Billing not found')
            
            const accountType = billing.accountType

            // Check Last Returned and Count
            const count = billing[workflowTypeCount] || 0
            const currentTime = moment(new Date())
            const lastTime = moment(billing[workflowTypeLast] || new Date())
            const secondsSinceLast = currentTime.diff(lastTime, 'seconds')
            
            // Rate limit settings
            const rateLimitSeconds = 5 * 60
            let rateLimitCount = 0

            if (accountType === 'free') {
                rateLimitCount = 1
            } else if (accountType === 'standard') {
                rateLimitCount = 5
            } else if (accountType === 'developer') {
                rateLimitCount = 10
            } else if (accountType === 'professional') {
                rateLimitCount = 25
            } else {
                return res.status(500).send('Account type not found')
            }

            const rateLimitLeft = rateLimitCount - count
            const rateLimit = secondsSinceLast < rateLimitSeconds
            const retryAfter = rateLimitSeconds - secondsSinceLast

            // Rate limit functionality
            if (rateLimitLeft > 0) {
                billing[workflowTypeCount] = billing[workflowTypeCount] + 1
                billing[workflowTypeLast] = new Date()
                await billing.save()
            } else if (rateLimitLeft === 0) {
                if (!rateLimit) {
                    billing[workflowTypeCount] = 1
                    billing[workflowTypeLast] = new Date()
                    await billing.save()
                } else {
                    const returnHeader = { 'Retry-After': retryAfter }
                    return res.set(returnHeader).status(429).send(`Retry again in ${retryAfter} seconds`)
                }
            }

            // Create instance
            const instance = new IndexSchema.Instance({
                sub: req.user.sub,
                project: workflow.project,
                workflow: workflow._id,
                workflowName: workflow.name,
            })
            await instance.save()

            // Emit Socket
            socketService.io.emit(req.user.sub, {
                eventDetail: 'Received...',
                instanceId: instance._id,
                workflowName: workflow.name,
                requestName: '',
                statusCode: '',
                duration: '',
                responseSize: '',
                message: '',
            });

            if (workflowType === 'returnWorkflow') {
                // start immediately
                const workflowResult = await instanceTools.start(instance._id, req.body)
                // return result
                return res.status(200).send(workflowResult)
            } else if (workflowType === 'queueWorkflow') {
                // queue immediately
                const instanceJob = new CronJob({
                    cronTime: moment().add(5, 'seconds'),
                    onTick: () => {
                        instanceTools.start(instance._id, req.body)
                    },
                    start: true,
                })
                // return queue id
                return res.status(200).send(instance._id)
            } else if (workflowType === 'scheduleWorkflow') {
                // schedule immediately
                const instanceJob = new CronJob({
                    cronTime: moment().add(15, 'seconds'),
                    onTick: () => {
                        instanceTools.start(instance._id, req.body)
                    },
                    start: true,
                })
                // return schedule id
                return res.status(200).send(instance._id)
            }

        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}