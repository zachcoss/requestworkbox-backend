const
    ValidateRequest = require('../validate/Request');

module.exports = {
    createRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.createRequest.validate(req)
            const authorize = await ValidateRequest.createRequest.authorize(payload)
            const request = await ValidateRequest.createRequest.request(authorize)
            return ValidateRequest.createRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.createRequest.error(err, res)
        }
    },
    listRequests: async (req, res, next) => {
        try {
            const payload = ValidateRequest.listRequests.validate(req)
            const authorize = await ValidateRequest.listRequests.authorize(payload)
            const request = await ValidateRequest.listRequests.request(authorize)
            return ValidateRequest.listRequests.response(request, res)
        } catch (err) {
            return ValidateRequest.listRequests.error(err, res)
        }
    },
    getRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.getRequest.validate(req)
            const authorize = await ValidateRequest.getRequest.authorize(payload)
            const request = await ValidateRequest.getRequest.request(authorize)
            return ValidateRequest.getRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.getRequest.error(err, res)
        }
    },
    saveRequestChanges: async (req, res, next) => {
        try {
            const payload = ValidateRequest.saveRequestChanges.validate(req)
            const authorize = await ValidateRequest.saveRequestChanges.authorize(payload)
            const request = await ValidateRequest.saveRequestChanges.request(authorize)
            return ValidateRequest.saveRequestChanges.response(request, res)
        } catch (err) {
            return ValidateRequest.saveRequestChanges.error(err, res)
        }
    },
    addRequestDetailItem: async (req, res, next) => {
        try {
            const payload = ValidateRequest.addRequestDetailItem.validate(req)
            const authorize = await ValidateRequest.addRequestDetailItem.authorize(payload)
            const request = await ValidateRequest.addRequestDetailItem.request(authorize)
            return ValidateRequest.addRequestDetailItem.response(request, res)
        } catch (err) {
            return ValidateRequest.addRequestDetailItem.error(err, res)
        }
    },
    deleteRequestDetailItem: async (req, res, next) => {
        try {
            const payload = ValidateRequest.deleteRequestDetailItem.validate(req)
            const authorize = await ValidateRequest.deleteRequestDetailItem.authorize(payload)
            const request = await ValidateRequest.deleteRequestDetailItem.request(authorize)
            return ValidateRequest.deleteRequestDetailItem.response(request, res)
        } catch (err) {
            return ValidateRequest.deleteRequestDetailItem.error(err, res)
        }
    },
    archiveRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.archiveRequest.validate(req)
            const authorize = await ValidateRequest.archiveRequest.authorize(payload)
            const request = await ValidateRequest.archiveRequest.request(authorize)
            return ValidateRequest.archiveRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.archiveRequest.error(err, res)
        }
    },
    restoreRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.restoreRequest.validate(req)
            const authorize = await ValidateRequest.restoreRequest.authorize(payload)
            const request = await ValidateRequest.restoreRequest.request(authorize)
            return ValidateRequest.restoreRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.restoreRequest.error(err, res)
        }
    },
}