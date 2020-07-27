const
    _ = require('lodash'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    newRequest: async (req, res, next) => {
        try {
            // const requestAllowedKeys = []
            // IndexSchema.RequestSchema.eachPath((pathName) => requestAllowedKeys.push(pathName))
            // const requestKeys = _.omit(requestAllowedKeys, '_id')

            const newRequest = { sub: req.user.sub, project: req.body.projectId }

            if (req.body.adapter) {
                newRequest['requestSettings'] = {
                    requestType: 'adapter'
                }
            }

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
    // addToWorkflow: async (req, res, next) => {
    //     try {
    //         const task = new IndexSchema.Task({ sub: req.user.sub, request: req.body.requestId })
    //         const workflow = await IndexSchema.Workflow.findOne({ sub: req.user.sub, _id: req.body.workflowId })
    //         workflow.push(task)
    //         await task.save()
    //         await project.save()
    //         return res.status(200).send({ _id: workflow._id })
    //     } catch (err) {
    //         return res.status(500).send(err)
    //     }
    // },
    testRequest: async (req, res, next) => {
        try {
            const request = await IndexSchema.Request.findOne({ sub: req.user.sub, _id: req.body.requestId })
            const task = new IndexSchema.Task({ sub: req.user.sub, request: request._id })
            const workflow = new IndexSchema.Workflow({ sub: req.user.sub, tasks: [task] })
            const instance = new IndexSchema.Instance({ sub: req.user.sub, workflow: workflow })
            await task.save()
            await workflow.save()
            await instance.save()
            return res.status(200).send({ _id: instance._id })
        } catch (err) {
            return res.status(500).send(err)
        }
    },
}