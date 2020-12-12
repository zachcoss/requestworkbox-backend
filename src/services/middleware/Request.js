const
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
    listRequests: async (req, res, next) => {
        try {
            const payload = ValidateRequest.listRequests.validate(req)
            const request = await ValidateRequest.listRequests.request(payload)
            return ValidateRequest.listRequests.response(request, res)
        } catch (err) {
            return ValidateRequest.listRequests.error(err, res)
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
            const payload = ValidateRequest.addRequestDetailItem.validate(req)
            const request = await ValidateRequest.addRequestDetailItem.request(payload)
            return ValidateRequest.addRequestDetailItem.response(request, res)
        } catch (err) {
            return ValidateRequest.addRequestDetailItem.error(err, res)
        }
    },
    deleteRequestDetailItem: async (req, res, next) => {
        try {
            const payload = ValidateRequest.deleteRequestDetailItem.validate(req)
            const request = await ValidateRequest.deleteRequestDetailItem.request(payload)
            return ValidateRequest.deleteRequestDetailItem.response(request, res)
        } catch (err) {
            return ValidateRequest.deleteRequestDetailItem.error(err, res)
        }
    },
    archiveRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.archiveRequest.validate(req)
            const request = await ValidateRequest.archiveRequest.request(payload)
            return ValidateRequest.archiveRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.archiveRequest.error(err, res)
        }
    },
    restoreRequest: async (req, res, next) => {
        try {
            const payload = ValidateRequest.restoreRequest.validate(req)
            const request = await ValidateRequest.restoreRequest.request(payload)
            return ValidateRequest.restoreRequest.response(request, res)
        } catch (err) {
            return ValidateRequest.restoreRequest.error(err, res)
        }
    },
}