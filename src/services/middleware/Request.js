const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getRequests: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v'
            const requests = await IndexSchema.Request.find(findPayload, projection)
            return res.status(200).send(requests)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getRequestDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.requestId }
            const projection = '-__v'
            const request = await IndexSchema.Request.findOne(findPayload, projection)
            return res.status(200).send(request)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    saveRequestChanges: async (req, res, next) => {
        try {
            const updates = _.pick(req.body, ['url','parameters', 'query', 'headers', 'cookies', 'body', 'taskPermissions', 'requestSettings', 'requestAdapters', 'responseAdapters'])
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            _.each(updates, (value, key) => {
                request[key] = value
            })
            await request.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    addRequestDetailItem: async (req, res, next) => {
        try {

            const requestDetailOption = req.body.requestDetailOption
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            const newItem = {
                _id: mongoose.Types.ObjectId(),
                key: '',
                value: '',
                acceptInput: false,
            }
            request[requestDetailOption].push(newItem)
            await request.save()
            return res.status(200).send(newItem)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteRequestDetailItem: async (req, res, next) => {
        try {
            const requestDetailOption = req.body.requestDetailOption
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            request[requestDetailOption].id(req.body.requestDetailItemId).remove()
            await request.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    addRequestAdapter: async (req, res, next) => {
        try {
            const adapterType = req.body.adapterType
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            const newItem = {
                _id: mongoose.Types.ObjectId(),
                onFailure: 'stopWorkflow'
            }
            request[adapterType].push(newItem)
            await request.save()
            return res.status(200).send(newItem)
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteRequestAdapter: async (req, res, next) => {
        try {
            const adapterType = req.body.adapterType
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            request[adapterType].id(req.body.adapterId).remove()
            await request.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    }
}