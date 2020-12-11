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
        if (!req.body._id) throw new Error('Missing request id.')
        if (!req.body.requestDetailOption)  throw new Error('Missing request detail option.')
        if (!req.body.requestDetailItemId)  throw new Error('Missing request detail item id.')

        if (!_.isHex(req.body._id)) throw new Error('Incorrect request id type.')
        if (!_.isHex(req.body.requestDetailItemId)) throw new Error('Incorrect request detail item id type.')
        if (!_.includes(['query','headers','body'], req.body.requestDetailOption)) {
            throw new Error('Incorrect request detail option type.')
        }

        const payload = {
            sub: req.user.sub,
            _id: req.body._id,
            requestDetailOption: req.body.requestDetailOption,
            requestDetailItemId: req.body.requestDetailItemId,
        }

        return payload
    },
    request: async function(payload) {
        try {

            const request = await IndexSchema.Request.findOne({
                sub: payload.sub,
                _id: payload._id,
            })

            if (!request || !request._id) throw new Error('Request not found.')

            request[payload.requestDetailOption].id(payload.requestDetailItemId).remove()
            await request.save()

            return request
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','url','active','project','query','headers','body','createdAt','updatedAt']
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing request id.') return res.status(400).send(err.message)
        else if (err.message === 'Missing request detail option.') return res.status(400).send(err.message)
        else if (err.message === 'Missing request detail item id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect request id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect request detail option type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect request detail item id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Request not found.') return res.status(400).send('Request not found.')
        else {
            console.log('Delete request detail item error', err)
            return res.status(500).send('Request error')
        }
    },
}