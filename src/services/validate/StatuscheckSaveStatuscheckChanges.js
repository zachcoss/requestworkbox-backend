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
        if (!req.body._id) throw new Error('Missing statuscheck id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect statuscheck id type.')

        let updates = _.pick(req.body, ['_id'])
        updates.sub = req.user.sub

        if (req.body.onWorkflowTaskError) {
            if (!_.includes(['continue','exit'], req.body.onWorkflowTaskError)) throw new Error('Incorrect workflow task error type.')
            updates.onWorkflowTaskError = req.body.onWorkflowTaskError
        }

        if (req.body.sendWorkflowWebhook) {
            if (!_.includes(['always','never','onSuccess','onError'], req.body.sendWorkflowWebhook)) throw new Error('Incorrect send workflow webhook type.')
            updates.sendWorkflowWebhook = req.body.sendWorkflowWebhook
        }

        if (req.body.interval) {
            if (!_.includes(['15', '30', '60'], req.body.interval)) throw new Error('Incorrect interval type.')
            updates.interval = req.body.interval
        }

        return updates
    },
    request: async function(payload) {
        try {

            const statuscheck = await IndexSchema.Statuscheck.findOne({
                sub: payload.sub,
                _id: payload._id,
            })
            if (!statuscheck || !statuscheck._id) throw new Error('Statuscheck not found.')

            const updates = _.omit(payload, ['_id', 'sub'])

            _.each(updates, (value, key) => {
                statuscheck[key] = value
            })

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
        else if (err.message === 'Incorrect workflow task error type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect send workflow webhook type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect interval type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Statuscheck not found.') return res.status(400).send('Statuscheck not found.')
        else {
            console.log('Save statuscheck changes', err)
            return res.status(500).send('Request error')
        }
    },
}