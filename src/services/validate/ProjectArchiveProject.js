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

            const project = await IndexSchema.Project.findOne({ _id: projectId })
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            })
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.owner) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            
            return project
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function(project) {
        try {

            project.active = false
            await project.save()

            const statuschecks = await IndexSchema.Statuscheck.updateMany({ projectId: project._id, status: 'running', }, { status: 'stopped' })

            return project
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
        else if (err.message === 'Error: Project not found.') return res.status(400).send('Project not found.')
        else {
            console.log('Archive project error', err)
            return res.status(500).send('Request error')
        }
    },
}