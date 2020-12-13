const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    socketService = require('../tools/socket'),
    Stats = require('../tools/stats').stats;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.queueId) throw new Error('Missing queue id.')
        if (!_.isHex(req.body.queueId)) throw new Error('Incorrect queue id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body.queueId,
        }

        return payload
    },
    request: async function(payload) {
        try {

            const queue = await IndexSchema.Queue.findOne(payload)
            if (!queue || !queue._id) throw new Error('Queue not found.')

            await Stats.updateQueueStats({ queue, status: 'archived' }, IndexSchema, socketService)

            return queue
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','active','status','stats','instance','workflow','workflowName','storage','queueType','statuscheckId','date','createdAt','updatedAt']
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing queue id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect queue id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Queue not found.') return res.status(400).send('Queue not found.')
        else {
            console.log('Archive queue error', err)
            return res.status(500).send('Request error')
        }
    },
}