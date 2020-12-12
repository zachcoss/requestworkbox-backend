const
    _ = require('lodash'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    socketService = require('../tools/socket'),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3;

const
    ValidateWorkflow = require('../validate/Workflow');

module.exports = {
    createWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.createWorkflow.validate(req)
            const request = await ValidateWorkflow.createWorkflow.request(payload)
            return ValidateWorkflow.createWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.createWorkflow.error(err, res)
        }
    },
    listWorkflows: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.listWorkflows.validate(req)
            const request = await ValidateWorkflow.listWorkflows.request(payload)
            return ValidateWorkflow.listWorkflows.response(request, res)
        } catch (err) {
            return ValidateWorkflow.listWorkflows.error(err, res)
        }
    },
    getWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.getWorkflow.validate(req)
            const request = await ValidateWorkflow.getWorkflow.request(payload)
            return ValidateWorkflow.getWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.getWorkflow.error(err, res)
        }
    },
    saveWorkflowChanges: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.saveWorkflowChanges.validate(req)
            const request = await ValidateWorkflow.saveWorkflowChanges.request(payload)
            return ValidateWorkflow.saveWorkflowChanges.response(request, res)
        } catch (err) {
            return ValidateWorkflow.saveWorkflowChanges.error(err, res)
        }
    },
    addWorkflowTask: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.addWorkflowTask.validate(req)
            const request = await ValidateWorkflow.addWorkflowTask.request(payload)
            return ValidateWorkflow.addWorkflowTask.response(request, res)
        } catch (err) {
            return ValidateWorkflow.addWorkflowTask.error(err, res)
        }
    },
    deleteWorkflowTask: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.deleteWorkflowTask.validate(req)
            const request = await ValidateWorkflow.deleteWorkflowTask.request(payload)
            return ValidateWorkflow.deleteWorkflowTask.response(request, res)
        } catch (err) {
            return ValidateWorkflow.deleteWorkflowTask.error(err, res)
        }
    },
    archiveWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.archiveWorkflow.validate(req)
            const request = await ValidateWorkflow.archiveWorkflow.request(payload)
            return ValidateWorkflow.archiveWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.archiveWorkflow.error(err, res)
        }
    },
    restoreWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.restoreWorkflow.validate(req)
            const request = await ValidateWorkflow.restoreWorkflow.request(payload)
            return ValidateWorkflow.restoreWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.restoreWorkflow.error(err, res)
        }
    },
    startWorkflow: async (req, res, next) => {
        try {

            let workflowType = ''

            if (_.includes(req.path, '/return-workflow/')) {
                workflowType = 'returnWorkflow'
            } else if (_.includes(req.path, '/queue-workflow/')) {
                workflowType = 'queueWorkflow'
            } else if (_.includes(req.path, '/schedule-workflow/')) {
                workflowType = 'scheduleWorkflow'
            } else if (_.includes(req.path, '/statuscheck-workflow/')) {
                workflowType = 'statuscheckWorkflow'
            } else {
                return res.status(500).send('Workflow type not found')
            }

            const workflowTypeCount = `${workflowType}Count`
            const workflowTypeLast = `${workflowType}Last`

            // Check Statuscheck
            let statuscheck;
            let statuscheckInterval = 60
            if (workflowType === 'statuscheckWorkflow') {
                statuscheck = await IndexSchema.Statuscheck.findOne({ workflowId: req.params.workflowId })
                if (!statuscheck) return res.status(500).send('Statuscheck not found')
                if (!statuscheck.active) return res.status(500).send('Statuscheck is archived. Please restore and try again.')
                if (statuscheck.status === 'stopped') return res.status(500).send('Statuscheck is stopped. Please change status to running.')

                statuscheckInterval = statuscheck.interval || 60

                req.user = { sub: statuscheck.sub }
            }

            // Find Queue
            const workflow = await IndexSchema.Workflow.findOne({ _id: req.params.workflowId, sub: req.user.sub })
            if (!workflow) return res.status(500).send('Workflow not found')

            // Find Settings
            const setting = await IndexSchema.Setting.findOne({ sub: req.user.sub })
            if (!setting) return res.status(500).send('Settings not found')
            if (setting.globalWorkflowStatus !== 'running') return res.status(500).send('Global Workflow Status is stopped.')

            // Find Project
            const project = await IndexSchema.Project.findOne({ _id: workflow.project, sub: req.user.sub })
            if (!project) return res.status(500).send('Project not found')
            if (!project.active) return res.status(500).send('Project is archived. Please restore and try again.')

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
            const rateLimitSeconds = 60
            let rateLimitCount = 0
            let taskLimitCount = 0

            if (accountType === 'free') {
                queueDelaySeconds = 30
                scheduleWindowSeconds = 5 * 60
                rateLimitCount = 5
                taskLimitCount = 2
            } else if (accountType === 'standard') {
                queueDelaySeconds = 15
                scheduleWindowSeconds = 60 * 60
                rateLimitCount = 25
                taskLimitCount = 3
            } else if (accountType === 'developer') {
                queueDelaySeconds = 5
                scheduleWindowSeconds = (60 * 60) * 12
                rateLimitCount = 60
                taskLimitCount = 5
            } else if (accountType === 'professional') {
                queueDelaySeconds = 1
                scheduleWindowSeconds = (60 * 60) * 24
                rateLimitCount = 250
                taskLimitCount = 15
            } else {
                return res.status(500).send('Account type not found')
            }

            // Confirm task size
            const taskCount = _.size(workflow.tasks)
            if (taskCount > taskLimitCount) {
                const message = `${_.upperFirst(accountType)} accounts are limited to ${taskLimitCount} tasks. Please update your workflow and try again.`
                return res.status(400).send(message)
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
                billing[workflowTypeCount] = (billing[workflowTypeCount] || 0) + 1
                billing[workflowTypeLast] = new Date()
                await billing.save()
            } else if (rateLimitLeft === 0) {
                console.log(2)
                if (!rateLimit) {
                    console.log(3)
                    billing[workflowTypeCount] = 1
                    billing[workflowTypeLast] = new Date()
                    await billing.save()
                } else {
                    console.log(4)
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
                    Bucket: process.env.STORAGE_BUCKET,
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
            } else if (workflowType === 'statuscheckWorkflow') {
                queue.queueType = 'statuscheck'
                queue.date = moment().add(statuscheckInterval, 'seconds')
                queue.statuscheckId = statuscheck._id

                statuscheck.nextQueueId = queue._id
                statuscheck.nextQueueDate = queue.date
                await statuscheck.save()
            }

            // Update instance and save
            instance.queueId = queue._id
            instance.queueType = queue.queueType
            await instance.save()

            // Create Queue Pending Stat
            await Stats.updateQueueStats({ queue, status: 'pending', }, IndexSchema, socketService)

            // Send to jobs
            if (workflowType === 'returnWorkflow') {
                return res.redirect(`${process.env.JOBS_URL}/return-workflow?queueid=${queue._id}`)
            } else if (workflowType === 'queueWorkflow' || 'scheduleWorkflow' || 'statuscheckWorkflow') {
                return res.status(200).send(queue._id)
            }

        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}