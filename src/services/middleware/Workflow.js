const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getWorkflows: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v'
            const requests = await IndexSchema.Workflow.find(findPayload, projection)
            return res.status(200).send(requests)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getWorkflowDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.workflowId }
            const projection = '-__v'
            const workflow = await IndexSchema.Workflow.findOne(findPayload, projection)
            return res.status(200).send(workflow)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    saveWorkflowChanges: async (req, res, next) => {
        try {
            const updates = _.pick(req.body, ['name','timeout','onTimeout','environment'])
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const workflow = await IndexSchema.Workflow.findOne(findPayload)
            _.each(updates, (value, key) => {
                workflow[key] = value
            })
            await workflow.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}