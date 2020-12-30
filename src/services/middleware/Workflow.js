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
    startRequest: async (req, res, next) => {
        try {
            if (!req.params.requestId) return res.status(400).send('Missing request id.')
            if (!_.isHex(req.params.requestId)) return res.status(400).send('Incorrect request id type.')

            if (_.includes(req.path, '/return-request/')) res.locals.queueType = 'return'
            else if (_.includes(req.path, '/queue-request/')) res.locals.queueType = 'queue'
            else if (_.includes(req.path, '/schedule-request/')) res.locals.queueType = 'schedule'
            else return res.status(400).send('Queue type not found.')

            let requestWorkflow = await IndexSchema.Workflow.findOne({
                requestId: req.params.requestId,
            }).lean()

            if (!requestWorkflow || !requestWorkflow._id) return res.status(400).send('Request workflow not found.')

            res.locals.workflow = requestWorkflow
            res.locals.workflowId = requestWorkflow._id
            res.locals.workflowType = 'request'
            res.locals.permissionType = `${res.locals.queueType}Request`
            return next()
        } catch(err) {
            console.log('Start request error', err)
            return res.status(500).send('Start request error.')
        }
    },
    startWorkflow: async (req, res, next) => {
        try {
            if (!req.params.workflowId) return res.status(400).send('Missing workflow id.')
            if (!_.isHex(req.params.workflowId)) return res.status(400).send('Incorrect workflow id type.')

            if (_.includes(req.path, '/return-workflow/')) res.locals.queueType = 'return'
            else if (_.includes(req.path, '/queue-workflow/')) res.locals.queueType = 'queue'
            else if (_.includes(req.path, '/schedule-workflow/')) res.locals.queueType = 'schedule'
            else return res.status(400).send('Queue type not found.')

            let workflow = await IndexSchema.Workflow.findOne({
                _id: req.params.workflowId,
            }).lean()

            if (!workflow || !workflow._id) return res.status(400).send('Workflow not found.')

            res.locals.workflow = workflow
            res.locals.workflowId = workflow._id
            res.locals.workflowType = 'workflow'
            res.locals.permissionType = `${res.locals.queueType}Workflow`
            return next()
        } catch(err) {
            console.log('Start request error', err)
            return res.status(500).send('Start request error.')
        }
    },
    initializeWorkflow: async (req, res, next) => {
        try {
            if (!res.locals.workflowId || !res.locals.workflowType) return res.status(400).send('Missing workflow information.')
            if (!_.isHex(res.locals.workflowId)) return res.status(400).send('Incorrect workflow information type.')
            if (!res.locals.workflow || !res.locals.workflow._id) return res.status(400).send('Missing workflow.')
            if (!_.isHex(res.locals.workflow._id)) return res.status(400).send('Incorrect workflow type.')

            if (res.locals.workflowId !== res.locals.workflow._id) return res.status(400).send('Incorrect workflow.')

            if (!_.includes(['request','workflow'], res.locals.workflowType)) return res.status(400).send('Incorrect workflow type.')
            if (!_.includes(['return','queue','schedule'], res.locals.queueType)) return res.status(400).send('Incorrect queue type.')
            if (!_.includes([
                'returnRequest','returnWorkflow','queueRequest',
                'queueWorkflow','scheduleRequest','scheduleWorkflow'],
                res.locals.permissionType)) return res.status(400).send('Incorrect workflow permission type.')

            const
                workflow = res.locals.workflow,
                workflowType = res.locals.workflowType,
                queueType = res.locals.queueType,
                permissionType = res.locals.permissionType;

            const project = await IndexSchema.Project.findOne({ _id: workflow.projectId })
            if (!project || !project._id) return res.status(400).send('Project not found.')
            if (!project.active) return res.status(400).send('Project is archived. Please restore and try again.')
            if (!project.projectType) return res.status(400).send('Missing project type.')
            if (project.globalWorkflowStatus !== 'running') return res.status(400).send(`Project global workflow status is ${project.globalWorkflowStatus}.`)
            if (!_.includes(['free','standard','developer','professional'], project.projectType)) return res.status(400).send('Incorrect project type.')

            const
                projectType = project.projectType,
                projectPermission = project[permissionType];
            
                if (!_.includes(['owner','team','public'], projectPermission)) return res.status(400).send('Incorrect permission type.')

            let member,
                publicUser = true,
                ipAddress = req.ip;

            if (req.user && req.user.sub && _.isString(req.user.sub)) {
                member = await IndexSchema.Member.findOne({
                    sub: req.user.sub,
                    projectId: project._id,
                }).lean()
                if (!member || !member._id) return res.status(401).send('Permission error.')
                if (!member.active) return res.status(401).send('Permission error.')
                publicUser = false
            }

            if (projectPermission === 'owner') {
                if (!member.owner) return res.status(401).send('Permission error.')
                if (member.status !== 'accepted') return res.status(401).send('Permission error.')
                if (member.permission !== 'write') return res.status(401).send('Permission error.')
            } else if (projectPermission === 'team') {
                if (member.status !== 'accepted') return res.status(401).send('Permission error.')
                if (member.permission !== 'write') return res.status(401).send('Permission error.')
            } else if (projectPermission === 'public') {
                if ((!member || !member._id) && (!req.user || !req.user.sub)) req.user = { sub: project.sub }
            }

            // Check Last Returned and Count
            const count = project.workflowCount || 0
            const currentTime = moment(new Date())
            const lastTime = moment(project.workflowLast || new Date())
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
            }

            // Check task list
            let numberOfTasks = _.size(workflow.tasks)
            
            _.each(workflow.tasks, (task) => {
                if (!task.active) numberOfTasks = numberOfTasks -1
            })

            if (numberOfTasks <= 0) return res.status(401).send('Missing active tasks.')
            if (numberOfTasks > taskLimitCount) return res.status(401).send(`Project is limited to ${taskLimitCount} active tasks.`)

            // Filter date
            if (queueType === 'schedule') {
                if (!req.query.date) return res.status(400).send('Schedule workflow error: missing date.')

                const shouldSchedule = moment(req.query.date).isBetween(moment(), moment().add(scheduleWindowSeconds,'seconds'))
                if (!shouldSchedule) return res.status(400).send(`Project dates are limited to scheduling within ${scheduleWindowSeconds} seconds of the request.`)
            }

            const rateLimitLeft = rateLimitCount - count
            const rateLimit = secondsSinceLast < rateLimitSeconds
            const retryAfter = rateLimitSeconds - secondsSinceLast

            // Rate limit functionality
            if (rateLimitLeft > 0) {
                project.workflowCount = (project.workflowCount || 0) + 1
                project.workflowLast = new Date()
                await project.save()
            } else if (rateLimitLeft === 0) {
                if (!rateLimit) {
                    project.workflowCount = 1
                    project.workflowLast = new Date()
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
                workflowType: workflowType,
                queueType: queueType,
                ipAddress,
                publicUser,
            })
            await instance.save()

            // Create Queue
            const queue = new IndexSchema.Queue({
                active: true,
                sub: req.user.sub,
                projectId: workflow.projectId,
                instanceId: instance._id,
                workflowId: workflow._id,
                workflowName: workflow.name,
                workflowType: workflowType,
                storageInstanceId: '',
                queueType: queueType,
                stats: [],
                ipAddress,
                publicUser,
            })
            await queue.save()

            // Create Queue Stat
            await Stats.updateQueueStats({ queue, status: 'received', }, IndexSchema, socketService)

            // Filter payload
            if (_.isPlainObject(req.body) && _.size(req.body) > 0) {

                // check payload value size
                if (Buffer.byteLength(JSON.stringify(req.body)) > 1000000) throw new Error('Body payload error: 1MB max allowed.')

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

            if (workflowType === 'request') {
                queue.requestId = workflow.requestId
                instance.requestId = workflow.requestId
            }

            // Update queue and save
            if (queueType === 'return') queue.date = new Date()
            else if (queueType === 'queue') queue.date = moment().add(queueDelaySeconds, 'seconds')
            else if (queueType === 'schedule') queue.date = moment(req.query.date)

            // Update instance and save
            instance.queueId = queue._id
            instance.queueType = queueType
            await instance.save()

            // Create Queue Pending Stat (which will call queue.save())
            await Stats.updateQueueStats({ queue, status: 'pending', }, IndexSchema, socketService)

            // Send to jobs
            if (queueType === 'return') {
                return res.redirect(`${process.env.JOBS_URL}/return-workflow?queueid=${queue._id}`)
            } else if (queueType === 'queue' || queueType === 'schedule') {
                if (publicUser) return res.sendStatus(200)
                else return res.status(200).send({ queueId: queue._id, instanceId: instance._id })
            }

        } catch (err) {
            console.log('Start workflow error', err)
            return res.status(500).send('Start workflow error.')
        }
    },
}