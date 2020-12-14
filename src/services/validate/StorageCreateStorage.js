const
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','storageType','storageValue','mimetype','originalname','size','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!req.body.storageType) throw new Error('Missing storage type.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
        if (!_.includes(['text','file'], req.body.storageType)) {
            throw new Error('Incorrect storage type.')
        }

        const payload = {
            sub: req.user.sub,
            _id: req.body.projectId,
            storageType: req.body.storageType,
        }

        return payload
    },
    request: async function(payload) {
        try {

            const project = await IndexSchema.Project.findOne({
                sub: payload.sub,
                _id: payload._id,
            })
            if (!project || !project._id) throw new Error('Project not found.')

            const storage = new IndexSchema.Storage({
                sub: project.sub,
                projectId: project._id,
                storageType: payload.storageType,
            })
            await storage.save()
            
            return storage
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing project id.') return res.status(400).send(err.message)
        else if (err.message === 'Missing storage type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect storage type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Project not found.') return res.status(400).send('Project not found.')
        else {
            console.log('Create storage error', err)
            return res.status(500).send('Request error')
        }
    },
}