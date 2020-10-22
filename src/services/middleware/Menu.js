const
    _ = require('lodash'),
    IndexSchema = require('@requestworkbox/internal-tools').schema;

module.exports = {
    newRequest: async (req, res, next) => {
        try {
            const newRequest = { sub: req.user.sub, project: req.body.projectId }
            const request = new IndexSchema.Request(newRequest)
            await request.save()
            return res.status(200).send({ _id: request._id })
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    newWorkflow: async (req, res, next) => {
        try {
            const workflow = new IndexSchema.Workflow({ sub: req.user.sub, project: req.body.projectId })
            await workflow.save()
            return res.status(200).send({ _id: workflow._id })
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    newProject: async (req, res, next) => {
        try {
            const project = new IndexSchema.Project({ sub: req.user.sub })
            await project.save()
            return res.status(200).send({ _id: project._id })
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    newStorage: async (req, res, next) => {
        try {
            const storage = new IndexSchema.Storage({ sub: req.user.sub, project: req.body.projectId, storageType: req.body.storageType })
            await storage.save()
            return res.status(200).send({ _id: storage._id })
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteEntireProject: async (req, res, next) => {
        try {
            // Delete Requests
            const requestDeletePayload = ({ sub: req.user.sub, project: req.body.projectId })
            const requestDelete = await IndexSchema.Request.deleteMany(requestDeletePayload)

            // Delete Workflows
            const workflowDeletePayload = ({ sub: req.user.sub, project: req.body.projectId })
            const workflowDelete = await IndexSchema.Workflow.deleteMany(workflowDeletePayload)

            // Delete Storage
            const storageDeletePayload = ({ sub: req.user.sub, project: req.body.projectId })
            const storageDelete = await IndexSchema.Storage.deleteMany(storageDeletePayload)

            // Archive Stats (Archive)
            const statArchivePayload = { sub: req.user.sub, project: req.body.projectId, active: true }
            const statArchive = await IndexSchema.Instance.updateMany(statArchivePayload, { active: false })

            // Archive Project (Archive)
            const project = await IndexSchema.Project.findOne({ sub: req.user.sub, _id: req.body.projectId })
            project.active = false
            await project.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}