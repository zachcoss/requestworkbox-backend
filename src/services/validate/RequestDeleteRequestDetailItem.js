const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','query','headers','body','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing request id.')
        if (!req.body.requestDetailOption)  throw new Error('Missing request detail option.')
        if (!req.body.requestDetailItemId)  throw new Error('Missing request detail item id.')

        if (!_.isHex(req.body._id)) throw new Error('Incorrect request id type.')
        if (!_.isHex(req.body.requestDetailItemId)) throw new Error('Incorrect request detail item id type.')
        if (!_.includes(['query','headers','body','authorization'], req.body.requestDetailOption)) {
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
            if (request.lockedResource && request.lockedResource === true && !member.owner) throw new Error('Permission error.')
            
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return {request, payload}
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({request, payload}) {
        try {

            request[payload.requestDetailOption].id(payload.requestDetailItemId).remove()
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
        console.log('Request: delete request detail item error.', err)
        return res.status(400).send(`Request: delete request detail item error. ${err.message}`)
    },
}