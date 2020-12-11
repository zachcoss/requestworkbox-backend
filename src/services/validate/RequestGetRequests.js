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

        let payload = { sub: req.user.sub, }

        if (req.body.projectId) {
            if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
            payload.project = req.body.projectId
        }

        return payload
    },
    request: async function(payload) {
        try {

            const requests = await IndexSchema.Request.find(payload)
            .sort({createdAt: -1})
            .limit(20)

            return requests
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            const responseData = _.pickBy(request, function(value, key) {
                const keys = ['_id','url','active','project','query','headers','body','createdAt','updatedAt']
                return _.includes(keys, key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send('Invalid or missing token.')
        else if (err.message === 'Incorrect project id type.') return res.status(400).send('Incorrect project id type.')
        else {
            console.log('Get requests error', err)
            return res.status(500).send('Request error')
        }
    },
}