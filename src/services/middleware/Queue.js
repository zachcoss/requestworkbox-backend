const
    _ = require('lodash'),
    moment = require('moment'),
    socketService = require('../tools/socket'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    getSchedule: async (req, res, next) => {
        if (!req.body.date) throw new Error('Missing date')

        try {
            const startDate = moment(req.body.date).startOf('day').toDate()
            const endDate = moment(req.body.date).endOf('day').toDate()
            const findPayload = {
                sub: req.user.sub,
                workflow: req.body.workflow,
                date: {
                    $gt: startDate,
                    $lt: endDate,
                }
            }

            const schedule = await IndexSchema.Queue.find(findPayload)

            console.log('found schedule')
            console.log(schedule)
            return res.status(200).send(schedule)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    archiveAllQueue: async (req, res, next) => {
        if (!req.body.workflow) throw new Error('Missing Workflow')
        if (!req.body.queueType) throw new Error('Missing Queue Type')
        if (!req.body.date) throw new Error('Missing Date')

        const queueType = req.body.queueType
        const startDate = moment().toDate()
        const endDate = moment(req.body.date).endOf('day').toDate()

        const findPayload = {
            sub: req.user.sub,
            workflow: req.body.workflow,
            date: {
                $gt: startDate,
                $lt: endDate,
            }
        }
        
        // Set queue type filter
        if (queueType !== 'all') {
            findPayload.queueType = req.body.queueType
        }

        // Update queue docs
        const queueDocs = await IndexSchema.Queue.find(findPayload).lean()
        const queueFindPayload = {
            _id: {
                $in: _.map(queueDocs, '_id')
            }
        }
        const queueUpdate = await IndexSchema.Queue.updateMany(queueFindPayload, { status: 'archived' })

        // Emit Socket
        _.each(queueDocs, (queue) => {
            queue.status = 'archived'
            socketService.io.emit(req.user.sub, {
                eventDetail: 'Archived...',
                instanceId: queue.instance,
                workflowName: queue.workflowName,
                queueDoc: queue,
            })
        })

        return res.status(200).send('OK')
    },
    archiveQueue: async (req, res, next) => {
        if (!req.body.queueId) throw new Error('Missing Queue Id')

        const findPayload = {
            sub: req.user.sub,
            _id: req.body.queueId,
        }
        
        // Update queue docs
        const queue = await IndexSchema.Queue.findOne(findPayload)

        if (!queue) throw new Error('Queue Not Found')

        queue.status = 'archived'
        await queue.save()

        // Emit Socket
        socketService.io.emit(req.user.sub, {
            eventDetail: 'Archived...',
            instanceId: queue.instance,
            workflowName: queue.workflowName,
            queueDoc: JSON.parse(JSON.stringify(queue)),
        })

        return res.status(200).send('OK')
    },
}