const 
    _ = require('lodash').mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','authorization','authorizationType','query','headers','body','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
        
        const payload = {
            sub: req.user.sub,
            _id: req.body.projectId,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                projectId = payload._id;

            const project = await IndexSchema.Project.findOne({ _id: projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Requires write permissions
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            const activeRequests = await IndexSchema.Request.countDocuments({
                active: true,
                projectId: project._id,
            })

            if (activeRequests >= 10) throw new Error('Rate limit error.')
            
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            const newRequest = new IndexSchema.Request({
                sub: payload.sub,
                projectId: payload._id,
                authorization: [{
                    active: true,
                    key: 'username',
                    value: '',
                    valueType: 'textInput',
                },{
                    active: true,
                    key: 'password',
                    value: '',
                    valueType: 'textInput',
                }],
            })
            await newRequest.save()

            const requestWorkflow = new IndexSchema.Workflow({
                sub: payload.sub,
                projectId: payload._id,
                requestId: newRequest._id,
                workflowType: 'request',
                name: 'Dedicated request workflow',
                tasks: [{
                    active: true,
                    requestId: newRequest._id,
                }]
            })
            await requestWorkflow.save()

            return newRequest.toJSON()
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
        console.log('Request: create request error.', err)
        return res.status(400).send(`Request: create request error. ${err.message}`)
    },
}