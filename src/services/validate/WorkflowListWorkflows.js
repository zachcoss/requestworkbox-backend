const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','requestId','workflowType','tasks','payloads','webhooks','createdAt','updatedAt'],
    permissionKeys = ['lockedResource', 'preventExecution'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')

        let payload = {
            sub: req.user.sub,
            projectId: req.body.projectId,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                projectId = payload.projectId;

            const project = await IndexSchema.Project.findOne({ _id: projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Requires read permissions
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission !== 'read' && 
                member.permission !== 'write' ) throw new Error('Permission error.')
            
            return project
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(project) {
        try {

            const workflows = await IndexSchema.Workflow.find({ projectId: project._id, workflowType: 'workflow' })
            .sort({createdAt: -1})
            .limit(20)
            .lean()

            return workflows
        } catch(err) {
            throw new Error(err.message)
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
        console.log('Workflow: list workflows error.', err)
        return res.status(400).send(err.message)
    },
}