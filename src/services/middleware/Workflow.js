const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    validUrl = require('valid-url'),
    IndexSchema = require('../tools/schema').schema;

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
    getWorkflow: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId, _id: req.body.workflowId, active: true }
            const projection = '-__v'
            
            const workflow = await IndexSchema.Workflow.findOne(findPayload, projection)
            
            if (!workflow) throw new Error('Could not find workflow')
            
            return res.status(200).send([workflow])
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
            const updates = _.pick(req.body, ['name','tasks','webhookRequestId'])

            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const workflow = await IndexSchema.Workflow.findOne(findPayload)

            _.each(updates, (value, key) => {
                workflow[key] = value
            })

            if (!updates.webhookRequestId || updates.webhookRequestId === '') {
                workflow.webhookRequestId = undefined
            }
            
            await workflow.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    addWorkflowTask: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const workflow = await IndexSchema.Workflow.findOne(findPayload)
            const newItem = {
                _id: mongoose.Types.ObjectId(),
            }
            workflow.tasks.push(newItem)
            await workflow.save()
            return res.status(200).send(newItem)
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteWorkflowTask: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const workflow = await IndexSchema.Workflow.findOne(findPayload)
            workflow.tasks.id(req.body.taskId).remove()
            await workflow.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    archiveWorkflow: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.workflowId }
            const workflow = await IndexSchema.Workflow.findOne(findPayload)
            workflow.active = false
            await workflow.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    restoreWorkflow: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.workflowId }
            const workflow = await IndexSchema.Workflow.findOne(findPayload)
            workflow.active = true
            await workflow.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteWorkflow: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.workflowId }
            const workflow = await IndexSchema.Workflow.findOne(findPayload)
            await workflow.remove()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}