const
    _ = require('lodash'),
    moment = require('moment'),
    socketService = require('../tools/socket'),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3;

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

            // Storage settings
            let payload = {}

            // Queue delay settings
            let queueDelaySeconds = 0
            let scheduleWindowSeconds = 0
            
            // Rate limit settings
            const rateLimitSeconds = 5 * 60
            let rateLimitCount = 0

            if (accountType === 'free') {
                queueDelaySeconds = 5 * 60
                scheduleWindowSeconds = 5 * 60
                rateLimitCount = 1
            } else if (accountType === 'standard') {
                queueDelaySeconds = 1 * 60
                scheduleWindowSeconds = 60 * 60
                rateLimitCount = 5
            } else if (accountType === 'developer') {
                queueDelaySeconds = 30
                scheduleWindowSeconds = (60 * 60) * 12
                rateLimitCount = 10
            } else if (accountType === 'professional') {
                queueDelaySeconds = 1
                scheduleWindowSeconds = (60 * 60) * 24
                rateLimitCount = 25
            } else {
                return res.status(500).send('Account type not found')
            }

            // Filter date
            if (workflowType === 'scheduleWorkflow') {
                if (!req.query.date) return res.status(400).send('Missing date')

                const shouldSchedule = moment(req.query.date).isBetween(moment(), moment().add(scheduleWindowSeconds,'seconds'))
                if (!shouldSchedule) return res.status(400).send(`Date should be within ${scheduleWindowSeconds} seconds`)
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

            // Create Queue
            const queue = new IndexSchema.Queue({
                active: true,
                sub: req.user.sub,
                instance: instance._id,
                workflow: workflow._id,
                workflowName: workflow.name,
                project: workflow.project,
                storage: '',
                stats: [],
            })
            await queue.save()

            // Create Queue Stat
            await Stats.updateQueueStats({ queue, status: 'received', }, IndexSchema, socketService)

            // Filter payload
            if (_.isPlainObject(req.body) && _.size(req.body) > 0) {
                // Create Queue Uploading Stat
                await Stats.updateQueueStats({ queue, status: 'uploading', }, IndexSchema, socketService)

                const payloadStart = new Date()
                // Create payload
                payload = JSON.stringify(req.body)
                const payloadBuffer = Buffer.from(payload, 'utf8')
                // Store payload
                await S3.upload({
                    Bucket: "connector-storage",
                    Key: `${req.user.sub}/request-payloads/${instance._id}`,
                    Body: payloadBuffer
                }).promise()

                const payloadSize = Number(payloadBuffer.byteLength)
                
                const usages = [{
                    sub: req.user.sub,
                    usageType: 'storage',
                    usageDirection: 'up',
                    usageAmount: payloadSize,
                    usageMeasurement: 'byte',
                    usageLocation: 'queue',
                    usageId: instance._id,
                    usageDetail: `Body payload upload`,
                }, {
                    sub: req.user.sub,
                    usageType: 'storage',
                    usageDirection: 'time',
                    usageAmount: Number(new Date() - payloadStart),
                    usageMeasurement: 'ms',
                    usageLocation: 'queue',
                    usageId: instance._id,
                    usageDetail: `Body payload upload`,
                }]
    
                await Stats.updateInstanceUsage({ instance, usages, }, IndexSchema)

                // Update storage id
                queue.storage = instance._id
            }

            // Update queue and save
            if (workflowType === 'returnWorkflow') {
                queue.queueType = 'return'
                queue.date = new Date()
            } else if (workflowType === 'queueWorkflow') {
                queue.queueType = 'queue'
                queue.date = moment().add(queueDelaySeconds, 'seconds')
            } else if (workflowType === 'scheduleWorkflow') {
                queue.queueType = 'schedule'
                queue.date = moment(req.query.date)
            }

            // Create Queue Pending Stat
            await Stats.updateQueueStats({ queue, status: 'pending', }, IndexSchema, socketService)

            // Send to jobs
            if (workflowType === 'returnWorkflow') {
                return res.redirect(`${process.env.JOBS_URL}/return-workflow?queueid=${queue._id}`)
            } else if (workflowType === 'queueWorkflow' || 'scheduleWorkflow') {
                return res.status(200).send(queue._id)
            }

        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}