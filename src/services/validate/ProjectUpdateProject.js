const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        },
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectType','globalWorkflowStatus','workflowCount','workflowLast','createdAt','updatedAt','usage','usageRemaining','usageTotal'],
    permissionKeys = ['returnRequest','returnWorkflow','queueRequest','queueWorkflow','scheduleRequest','scheduleWorkflow'],
    projectPermissionValues = ['owner','team','public'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing project id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect project id type.')
        if (req.body.name && !_.isString(req.body.name)) throw new Error('Incorrect project name type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body._id,
            name: req.body.name,
        }

        if (req.body.returnWorkflow && _.includes(projectPermissionValues, req.body.returnWorkflow)) {
            payload.returnWorkflow = req.body.returnWorkflow
        }
        if (req.body.queueWorkflow && _.includes(projectPermissionValues, req.body.queueWorkflow)) {
            payload.queueWorkflow = req.body.queueWorkflow
        }
        if (req.body.scheduleWorkflow && _.includes(projectPermissionValues, req.body.scheduleWorkflow)) {
            payload.scheduleWorkflow = req.body.scheduleWorkflow
        }
        if (req.body.returnRequest && _.includes(projectPermissionValues, req.body.returnRequest)) {
            payload.returnRequest = req.body.returnRequest
        }
        if (req.body.queueRequest && _.includes(projectPermissionValues, req.body.queueRequest)) {
            payload.queueRequest = req.body.queueRequest
        }
        if (req.body.scheduleRequest && _.includes(projectPermissionValues, req.body.scheduleRequest)) {
            payload.scheduleRequest = req.body.scheduleRequest
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                projectId = payload._id;

            const project = await IndexSchema.Project.findOne({ _id: projectId })
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
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

            return { project, payload }
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({ project, payload }) {
        try {

            const updates = _.omit(payload, ['_id','sub'])

            _.each(updates, (val, key) => {
                project[key] = val
            })
            
            await project.save()

            return project.toJSON()
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
        console.log('Project: update project error.', err)
        return res.status(400).send(`Project: update project error. ${err.message}`)
    },
}