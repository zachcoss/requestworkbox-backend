const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','tasks','payloads','webhooks','createdAt','updatedAt'],
    permissionKeys = ['lockedResource', 'preventExecution'];
    

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
            
            const workflow = await IndexSchema.Workflow.findOne({ _id: workflowId, workflowType: 'workflow' })
            if (!workflow || !workflow._id) throw new Error('Workflow not found.')

            const project = await IndexSchema.Project.findOne({ _id: workflow.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (workflow.lockedResource && workflow.lockedResource === true && !member.owner) throw new Error('Permission error.')
            
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

            const archivedWorkflows = await IndexSchema.Workflow.countDocuments({
                active: false,
                projectId: project._id,
            })

            if (archivedWorkflows >= 10) throw new Error('Rate limit error.')
            
            return workflow
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(workflow) {
        try {

            workflow.active = false
            await workflow.save()

            return workflow.toJSON()
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
        console.log('Workflow: archive workflow error.', err)
        return res.status(400).send(err.message)
    },
}