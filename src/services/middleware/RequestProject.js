const
    _ = require('lodash'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    createProject: async (req, res, next) => {
        try {
            const project = new IndexSchema.Project({ sub: req.sub, name: req.body.name })
            await project.save()
            return res.status(200).send({ _id: project._id })
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    updateProjectName: async (req, res, next) => {
        try {
            const project = await IndexSchema.Project.findOne({ sub: req.sub, _id: req.body.projectId })
            project.name = req.body.name
            await project.save()
            return res.status(200).send({ _id: project._id, name: project.name })
        } catch (err) {
            return res.status(500).send(err)
        }
    },
}