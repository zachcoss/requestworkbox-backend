const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','tasks','payloads','webhooks','createdAt','updatedAt'],
    permissionKeys = ['lockedResource'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.workflowId) throw new Error('Missing workflow id.')
        if (!_.isHex(req.body.workflowId)) throw new Error('Incorrect workflow id type.')

        const payload = {
            sub: req.user.sub,
            _id: req.body.workflowId,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                workflowId = payload._id;
            
            const workflow = await IndexSchema.Workflow.findOne({ _id: workflowId })
            if (!workflow || !workflow._id) throw new Error('Workflow not found.')

            const project = await IndexSchema.Project.findOne({ _id: workflow.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            const activeWorkflows = await IndexSchema.Workflow.countDocuments({
                active: true,
                projectId: project._id,
            })

            if (activeWorkflows >= 10) throw new Error('Rate limit error.')
            
            return workflow
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function(workflow) {
        try {

            workflow.active = true
            await workflow.save()

            return workflow.toJSON()
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing workflow id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect workflow id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Workflow not found.') return res.status(400).send('Workflow not found.')
        else {
            console.log('Restore workflow error', err)
            return res.status(500).send('Request error')
        }
    },
}