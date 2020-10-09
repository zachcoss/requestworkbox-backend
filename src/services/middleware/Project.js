const
    _ = require('lodash'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getProjectName: async (req, res, next) => {
        try {
            const { name } = await IndexSchema.Project.findOne({ sub: req.user.sub, _id: req.body.projectId }, '-_id name')
            return res.status(200).send({ projectName: name })
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateProjectName: async (req, res, next) => {
        try {
            const project = await IndexSchema.Project.findOne({ sub: req.user.sub, _id: req.body.projectId })
            project.name = req.body.projectName
            await project.save()
            return res.status(200).send()
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    getProjects: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, active: true }
            const projection = 'name createdAt active'
            const projects = await IndexSchema.Project.find(findPayload, projection)
            return res.status(200).send(projects)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}