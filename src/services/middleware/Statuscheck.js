const ValidateStatuscheck = require('../validate/Statuscheck');

module.exports = {
    listStatuschecks: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.listStatuschecks.validate(req)
            const authorize = await ValidateStatuscheck.listStatuschecks.authorize(payload)
            const request = await ValidateStatuscheck.listStatuschecks.request(authorize)
            return ValidateStatuscheck.listStatuschecks.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.listStatuschecks.error(err, res)
        }
    },
    getStatuscheck: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.getStatuscheck.validate(req)
            const authorize = await ValidateStatuscheck.getStatuscheck.authorize(payload)
            const request = await ValidateStatuscheck.getStatuscheck.request(authorize)
            return ValidateStatuscheck.getStatuscheck.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.getStatuscheck.error(err, res)
        }
    },
    saveStatuscheckChanges: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.saveStatuscheckChanges.validate(req)
            const authorize = await ValidateStatuscheck.saveStatuscheckChanges.authorize(payload)
            const request = await ValidateStatuscheck.saveStatuscheckChanges.request(authorize)
            return ValidateStatuscheck.saveStatuscheckChanges.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.saveStatuscheckChanges.error(err, res)
        }
    },
    startStatuscheck: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.startStatuscheck.validate(req)
            const authorize = await ValidateStatuscheck.startStatuscheck.authorize(payload)
            const request = await ValidateStatuscheck.startStatuscheck.request(authorize)
            return ValidateStatuscheck.startStatuscheck.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.startStatuscheck.error(err, res)
        }
    },
    stopStatuscheck: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.stopStatuscheck.validate(req)
            const authorize = await ValidateStatuscheck.stopStatuscheck.authorize(payload)
            const request = await ValidateStatuscheck.stopStatuscheck.request(authorize)
            return ValidateStatuscheck.stopStatuscheck.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.stopStatuscheck.error(err, res)
        }
    },
}