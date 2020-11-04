const
    _ = require('lodash'),
    moment = require('moment'),
    socketService = require('../tools/socket'),
    Stats = require('../tools/stats').stats,
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
        const queueDocs = await IndexSchema.Queue.find(findPayload)

        for (queue of queueDocs) {
            await Stats.updateQueueStats({ queue, status: 'archived' }, IndexSchema, socketService)
        }

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

        await Stats.updateQueueStats({ queue, status: 'archived' }, IndexSchema, socketService)

        return res.status(200).send('OK')
    },
}