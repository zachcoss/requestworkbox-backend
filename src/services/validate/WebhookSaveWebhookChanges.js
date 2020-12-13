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
        if (!req.body._id) throw new Error('Missing webhook id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect webhook id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body._id,
        }

        if (req.body.name) {
            if (!_.isString(req.body.name)) throw new Error('Incorrect name type.')
            payload.name = req.body.name
        }

        return payload
    },
    request: async function(payload) {
        try {

            const webhook = await IndexSchema.Webhook.findOne({
                sub: payload.sub,
                _id: payload._id,
            })
            if (!webhook || !webhook._id) throw new Error('Webhook not found.')
            
            const updates = _.omit(payload, ['_id','sub'])

            _.each(updates, (value, key) => {
                webhook[key] = value
            })

            await webhook.save()

            return webhook
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','active','projectId','name','createdAt','updatedAt']
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing webhook id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect webhook id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect name type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Webhook not found.') return res.status(400).send('Webhook not found.')
        else {
            console.log('Save webhook changes error', err)
            return res.status(500).send('Request error')
        }
    },
}