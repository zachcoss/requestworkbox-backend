const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    validUrl = require('valid-url'),
    IndexSchema = require('../tools/schema').schema,
    ValidateRequest = require('../validate/Request');

module.exports = {
    createRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.createRequest.validate(req)
            const request = await ValidateRequest.createRequest.request(payload)
            return ValidateRequest.createRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.createRequest.error(err, res)
        }
    },
    getRequests: async (req, res, next) => {
        try {
            const payload = ValidateRequest.getRequests.validate(req)
            const request = await ValidateRequest.getRequests.request(payload)
            return ValidateRequest.getRequests.response(request, res)
        } catch (err) {
            return ValidateRequest.getRequests.error(err, res)
        }
    },
    getRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.getRequest.validate(req)
            const request = await ValidateRequest.getRequest.request(payload)
            return ValidateRequest.getRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.getRequest.error(err, res)
        }
    },
    saveRequestChanges: async (req, res, next) => {
        try {
            const payload = ValidateRequest.saveRequestChanges.validate(req)
            const request = await ValidateRequest.saveRequestChanges.request(payload)
            return ValidateRequest.saveRequestChanges.response(request, res)
        } catch (err) {
            return ValidateRequest.saveRequestChanges.error(err, res)
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
                valueType: 'textInput',
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
    archiveRequest: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.requestId }
            const request = await IndexSchema.Request.findOne(findPayload)
            request.active = false
            await request.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    restoreRequest: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.requestId }
            const request = await IndexSchema.Request.findOne(findPayload)
            request.active = true
            await request.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}