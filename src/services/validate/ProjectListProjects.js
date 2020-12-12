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

        const payload = {
            sub: req.user.sub,
        }

        return payload
    },
    request: async function(payload) {
        try {
            const projects = await IndexSchema.Project.find(payload)
            return projects
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            const responseData = _.pickBy(request, function(value, key) {
                const keys = ['_id','active','name','createdAt','updatedAt']
                return _.includes(keys, key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else {
            console.log('Get projects error', err)
            return res.status(500).send('Request error')
        }
    },
}