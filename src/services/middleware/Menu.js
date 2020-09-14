const
    _ = require('lodash'),
    IndexSchema = require('../schema/indexSchema');

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
            console.log(err)
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
}