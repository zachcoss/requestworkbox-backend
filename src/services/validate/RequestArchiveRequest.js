const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','authorization','authorizationType','query','headers','body','workflowId','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

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
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                requestId = payload._id;
            
            const request = await IndexSchema.Request.findOne({ _id: requestId })
            if (!request || !request._id) throw new Error('Request not found.')

            const project = await IndexSchema.Project.findOne({ _id: request.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Locked resource does not apply because endpoint is already "owner only"
            // Requires owner permission
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (!member.owner) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            const archivedRequests = await IndexSchema.Request.countDocuments({
                active: false,
                projectId: project._id,
            })

            if (archivedRequests >= 10) throw new Error('Rate limit error.')
            
            return request
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(request) {
        try {
            
            request.active = false
            await request.save()

            return request.toJSON()
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Request: archive request error.', err)
        return res.status(400).send(err.message)
    },
}