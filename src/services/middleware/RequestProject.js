const
    _ = require('lodash'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getProjectName: async (req, res, next) => {
        try {
            const { name } = await IndexSchema.Project.findOne({ sub: req.sub, _id: req.body.projectId }, '-_id name')
            return res.status(200).send({ projectName: name })
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    updateProjectName: async (req, res, next) => {
        try {
            const project = await IndexSchema.Project.findOne({ sub: req.sub, _id: req.body.projectId })
            project.name = req.body.projectName
            await project.save()
            return res.status(200)
        } catch (err) {
            return res.status(500).send(err)
        }
    },
}