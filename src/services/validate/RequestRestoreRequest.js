const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','query','headers','body','createdAt','updatedAt'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.requestId) throw new Error('Missing request id.')
        if (!_.isHex(req.body.requestId)) throw new Error('Incorrect request id type.')

        const payload = {
            sub: req.user.sub,
            _id: req.body.requestId,
        }

        return payload
    },
    request: async function(payload) {
        try {

            const request = await IndexSchema.Request.findOne(payload)

            if (!request || !request._id) throw new Error('Request not found.')

            request.active = true
            await request.save()

            return request
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing request id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect request id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Request not found.') return res.status(400).send('Request not found.')
        else {
            console.log('Restore request error', err)
            return res.status(500).send('Request error')
        }
    },
}