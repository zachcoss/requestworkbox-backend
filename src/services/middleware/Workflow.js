const
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    moment = require('moment'),
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
            const authorize = await ValidateWorkflow.createWorkflow.authorize(payload)
            const request = await ValidateWorkflow.createWorkflow.request(authorize)
            return ValidateWorkflow.createWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.createWorkflow.error(err, res)
        }
    },
    listWorkflows: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.listWorkflows.validate(req)
            const authorize = await ValidateWorkflow.listWorkflows.authorize(payload)
            const request = await ValidateWorkflow.listWorkflows.request(authorize)
            return ValidateWorkflow.listWorkflows.response(request, res)
        } catch (err) {
            return ValidateWorkflow.listWorkflows.error(err, res)
        }
    },
    getWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.getWorkflow.validate(req)
            const authorize = await ValidateWorkflow.getWorkflow.authorize(payload)
            const request = await ValidateWorkflow.getWorkflow.request(authorize)
            return ValidateWorkflow.getWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.getWorkflow.error(err, res)
        }
    },
    saveWorkflowChanges: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.saveWorkflowChanges.validate(req)
            const authorize = await ValidateWorkflow.saveWorkflowChanges.authorize(payload)
            const request = await ValidateWorkflow.saveWorkflowChanges.request(authorize)
            return ValidateWorkflow.saveWorkflowChanges.response(request, res)
        } catch (err) {
            return ValidateWorkflow.saveWorkflowChanges.error(err, res)
        }
    },
    addWorkflowTask: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.addWorkflowTask.validate(req)
            const authorize = await ValidateWorkflow.addWorkflowTask.authorize(payload)
            const request = await ValidateWorkflow.addWorkflowTask.request(authorize)
            return ValidateWorkflow.addWorkflowTask.response(request, res)
        } catch (err) {
            return ValidateWorkflow.addWorkflowTask.error(err, res)
        }
    },
    deleteWorkflowTask: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.deleteWorkflowTask.validate(req)
            const authorize = await ValidateWorkflow.deleteWorkflowTask.authorize(payload)
            const request = await ValidateWorkflow.deleteWorkflowTask.request(authorize)
            return ValidateWorkflow.deleteWorkflowTask.response(request, res)
        } catch (err) {
            return ValidateWorkflow.deleteWorkflowTask.error(err, res)
        }
    },
    archiveWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.archiveWorkflow.validate(req)
            const authorize = await ValidateWorkflow.archiveWorkflow.authorize(payload)
            const request = await ValidateWorkflow.archiveWorkflow.request(authorize)
            return ValidateWorkflow.archiveWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.archiveWorkflow.error(err, res)
        }
    },
    restoreWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.restoreWorkflow.validate(req)
            const authorize = await ValidateWorkflow.restoreWorkflow.authorize(payload)
            const request = await ValidateWorkflow.restoreWorkflow.request(authorize)
            return ValidateWorkflow.restoreWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.restoreWorkflow.error(err, res)
        }
    },
    startWorkflow: async (req, res, next) => {
        try {

            if (!req.params.workflowId) return res.status(400).send('Missing workflow id.')
            if (!_.isHex(req.params.workflowId)) return res.status(400).send('Incorrect workflow id type.')

            let workflowId = req.params.workflowId,
                workflowType,
                isWorkflow = false;

            if (_.includes(req.path, '/return-workflow/')) {
                workflowType = 'returnWorkflow'
                isWorkflow = true
            } else if (_.includes(req.path, '/queue-workflow/')) {
                workflowType = 'queueWorkflow'
                isWorkflow = true
            } else if (_.includes(req.path, '/schedule-workflow/')) {
                workflowType = 'scheduleWorkflow'
                isWorkflow = true
            } else {
                return res.status(400).send('Workflow type not found.')
            }
            
            const workflow = await IndexSchema.Workflow.findOne({ _id: workflowId })
            if (!workflow || !workflow._id) return res.status(400).send('Workflow not found.')

            const project = await IndexSchema.Project.findOne({ _id: workflow.projectId }).lean()
            if (!project || !project._id) return res.status(400).send('Project not found.')
            if (!project.active) return res.status(400).send('Project is archived. Please restore and try again.')
            if (project.globalWorkflowStatus !== 'running') return res.status(400).send('Project global workflow status is stopped.')
            if (!project.projectType) return res.status(400).send('Missing project type.')

            const projectType = project.projectType

            const requiredPermissions = project[workflowType]
            
            let member,
                ipAddress = req.ip;

            if (req.user && req.user.sub && _.isString(req.user.sub)) {
                member = await IndexSchema.Member.findOne({
                    sub: req.user.sub,
                    projectId: project._id,
                }).lean()
            }

            if (requiredPermissions === 'owner') {
                if (!member || !member._id) return res.status(401).send('Permission error.')
                if (!member.owner) return res.status(401).send('Permission error.')
                if (!member.active) return res.status(401).send('Permission error.')
                if (member.status !== 'accepted') return res.status(401).send('Permission error.')
                if (member.permission !== 'write') return res.status(401).send('Permission error.')
            } else if (requiredPermissions === 'team') {
                if (!member || !member._id) return res.status(401).send('Permission error.')
                if (!member.active) return res.status(401).send('Permission error.')
                if (member.status !== 'accepted') return res.status(401).send('Permission error.')
            } else if (requiredPermissions === 'public') {
                req.user = { sub: project.sub }
            }

            let rateCount,
                rateLast;

            if (isWorkflow) {
                rateCount = 'workflowCount'
                rateLast = 'workflowLast'
            } else {
                rateCount = 'requestCount'
                rateLast = 'requestLast'
            }

            // Check Last Returned and Count
            const count = project[rateCount] || 0
            const currentTime = moment(new Date())
            const lastTime = moment(project[rateLast] || new Date())
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

            if (projectType === 'free') {
                queueDelaySeconds = 30
                scheduleWindowSeconds = 5 * 60
                rateLimitCount = 5
                taskLimitCount = 2
            } else if (projectType === 'standard') {
                queueDelaySeconds = 15
                scheduleWindowSeconds = 60 * 60
                rateLimitCount = 25
                taskLimitCount = 3
            } else if (projectType === 'developer') {
                queueDelaySeconds = 5
                scheduleWindowSeconds = (60 * 60) * 12
                rateLimitCount = 60
                taskLimitCount = 5
            } else if (projectType === 'professional') {
                queueDelaySeconds = 1
                scheduleWindowSeconds = (60 * 60) * 24
                rateLimitCount = 250
                taskLimitCount = 15
            } else {
                return res.status(500).send('Project type not found.')
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
                project[rateCount] = (project[rateCount] || 0) + 1
                project[rateLast] = new Date()
                await project.save()
            } else if (rateLimitLeft === 0) {
                if (!rateLimit) {
                    project[rateCount] = 1
                    project[rateLast] = new Date()
                    await project.save()
                } else {
                    const returnHeader = { 'Retry-After': retryAfter }
                    return res.set(returnHeader).sendStatus(429)
                }
            }

            // Create instance
            const instance = new IndexSchema.Instance({
                sub: req.user.sub,
                projectId: workflow.projectId,
                workflowId: workflow._id,
                workflowName: workflow.name,
                ipAddress,
            })
            await instance.save()

            // Create Queue
            const queue = new IndexSchema.Queue({
                active: true,
                sub: req.user.sub,
                instanceId: instance._id,
                workflowId: workflow._id,
                workflowName: workflow.name,
                projectId: workflow.projectId,
                storageInstanceId: '',
                stats: [],
                ipAddress,
            })
            await queue.save()

            // Create Queue Stat
            await Stats.updateQueueStats({ queue, status: 'received', }, IndexSchema, socketService)

            // Filter payload
            if (_.isPlainObject(req.body) && _.size(req.body) > 0) {

                // check payload value size
                if (Buffer.byteLength(JSON.stringify(req.body)) > 1000000) throw new Error('1MB max allowed.')

                // Create Queue Uploading Stat
                await Stats.updateQueueStats({ queue, status: 'uploading', }, IndexSchema, socketService)

                const payloadStart = new Date()
                // Create payload
                payload = JSON.stringify(req.body)
                const payloadBuffer = Buffer.from(payload, 'utf8')
                // Store payload
                await S3.upload({
                    Bucket: process.env.STORAGE_BUCKET,
                    Key: `${workflow.projectId}/workflow-payloads/${instance._id}`,
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

                // Update storageInstanceId id
                queue.storageInstanceId = instance._id
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

            // Update instance and save
            instance.queueId = queue._id
            instance.queueType = queue.queueType
            await instance.save()

            // Create Queue Pending Stat
            await Stats.updateQueueStats({ queue, status: 'pending', }, IndexSchema, socketService)

            // Send to jobs
            if (workflowType === 'returnWorkflow') {
                return res.redirect(`${process.env.JOBS_URL}/return-workflow?queueid=${queue._id}`)
            } else if (workflowType === 'queueWorkflow' || 'scheduleWorkflow') {
                return res.status(200).send(queue._id)
            }

        } catch (err) {
            console.log('Workflow error', err)
            return res.status(500).send('Workflow error.')
        }
    },
}