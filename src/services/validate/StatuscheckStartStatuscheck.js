const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.statuscheckId) throw new Error('Missing statuscheck id.')
        if (!_.isHex(req.body.statuscheckId)) throw new Error('Incorrect statuscheck id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body.statuscheckId,
        }

        return payload
    },
    request: async function(payload) {
        try {

            const statuscheck = await IndexSchema.Statuscheck.findOne(payload)
            if (!statuscheck || !statuscheck._id) throw new Error('Statuscheck not found.')

            statuscheck.status = 'running'
            await statuscheck.save()

            return statuscheck
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','active','status','onWorkflowTaskError','sendWorkflowWebhook','interval','projectId','workflowId','nextQueueDate','nextQueueId','lastInstanceId','createdAt','updatedAt']
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing statuscheck id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect statuscheck id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Statuscheck not found.') return res.status(400).send('Statuscheck not found.')
        else {
            console.log('Start statuscheck error', err)
            return res.status(500).send('Request error')
        }
    },
}