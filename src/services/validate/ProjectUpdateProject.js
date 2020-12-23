const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        },
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectType','globalWorkflowStatus','requestCount','requestLast','workflowCount','workflowLast','createdAt','updatedAt'],
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
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return { project, payload }
        } catch(err) {
            throw new Error(err)
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
        else if (err.message === 'Error: Permission error.') return res.status(401).send('Permission error.')
        else if (err.message === 'Missing project id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project name type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Project not found.') return res.status(400).send('Project not found.')
        else {
            console.log('Update project error', err)
            return res.status(500).send('Request error')
        }
    },
}