const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    newStorage: async (req, res, next) => {
        try {
            if (!req.body.projectId || req.body.projectId === '') throw new Error('Project id required.')

            const project = await IndexSchema.Project.findOne({ sub: req.user.sub, _id: req.body.projectId })

            if (!project || !project._id) throw new Error('Project not found.')
            if (project.sub !== req.user.sub) throw new Error('Project not found.')

            if (req.body.storageType || req.body.storageType === '') throw new Error('Missing storage type.')
            if (req.body.storageType !== 'text' && req.body.storageType !== 'file') throw new Error('Incorrect storage type.')

            const storage = new IndexSchema.Storage({ sub: req.user.sub, project: req.body.projectId, storageType: req.body.storageType })
            await storage.save()
            return res.status(200).send({ _id: storage._id })
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}