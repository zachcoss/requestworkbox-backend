const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
        if (!_.isString(req.body.name)) throw new Error('Incorrect project name type.')

        const payload = {
            sub: req.user.sub,
            projectId: req.body.projectId,
            name: req.body.name,
        }

        return payload
    },
    request: async function(payload) {
        try {
            const project = await IndexSchema.Project.findOne({
                sub: payload.sub,
                _id: payload.projectId,
            })

            if (!project || !project._id) throw new Error('Project not found.')

            project.name = payload.name
            await project.save()

            return project
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','active','name','createdAt','updatedAt']
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
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