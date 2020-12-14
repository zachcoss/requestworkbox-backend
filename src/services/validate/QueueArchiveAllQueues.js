const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    moment = require('moment'),
    socketService = require('../tools/socket'),
    Stats = require('../tools/stats').stats,
    keys = ['_id','active','status','stats','instanceId','workflowId','workflowName','storageInstanceId','queueType','statuscheckId','date','createdAt','updatedAt'],
    queueStatKeys = ['_id','active','status','statusText','error','instanceId','queueId','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.workflowId) throw new Error('Missing workflow id.')
        if (!req.body.queueType) throw new Error('Missing queue type.')
        if (!req.body.date) throw new Error('Missing date.')

        if (!_.isHex(req.body.workflowId)) throw new Error('Incorrect workflow id type.')
        if (!_.includes(['queue', 'schedule', 'return', 'all'], req.body.queueType)) throw new Error('Incorrect queue type.')
        if (!moment(req.body.date).isValid()) throw new Error('Incorrect date type.')

        const 
            startDate = moment().toDate(),
            endDate = moment(req.body.date).endOf('day').toDate();

        let payload = {
            sub: req.user.sub,
            workflowId: req.body.workflowId,
            date: {
                $gt: startDate,
                $lt: endDate,
            }
        }

        if (req.body.queueType === 'all') {
            payload.queueType = { $nin: ['statuscheck'] }
        } else {
            payload.queueType = req.body.queueType
        }

        return payload
    },
    request: async function(payload) {
        try {

            const queues = await IndexSchema.Queue.find(payload).limit(25)

            for (queue of queues) {
                await Stats.updateQueueStats({ queue, status: 'archived' }, IndexSchema, socketService)
            }

            return queues
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            let responseData = _.pickBy(request, function(value, key) {
                return _.includes(keys, key)
            })

            responseData.stats = _.map(responseData.stats, (stat) => {
                const responseData = _.pickBy(stat, function(value, key) {
                    return _.includes(queueStatKeys, key)
                })
                return responseData
            })

            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing workflow id.') return res.status(400).send(err.message)
        else if (err.message === 'Missing queue type.') return res.status(400).send(err.message)
        else if (err.message === 'Missing date.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect workflow id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect queue type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect date type.') return res.status(400).send(err.message)
        else {
            console.log('Archive all queues error', err)
            return res.status(500).send('Request error')
        }
    },
}