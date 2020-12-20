const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','permissions','createdAt','updatedAt'],
    permissionKeys = ['returnWorkflow','queueWorkflow','scheduleWorkflow','statuscheckWorkflow','webhookEndpoint'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')

        const payload = {
            sub: req.user.sub,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const requesterSub = payload.sub;
            const members = await IndexSchema.Member.find({ sub: requesterSub })
            
            return members
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function(members) {
        try {
            if (!_.size(members)) return []

            const projectIds = _.map(members, 'projectId')
            const projects = await IndexSchema.Project.find({ _id: { $in: projectIds }})
            return projects
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            let responseData = _.pickBy(request, function(value, key) {
                return _.includes(keys.concat(permissionKeys), key)
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