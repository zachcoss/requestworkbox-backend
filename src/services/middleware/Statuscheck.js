const
    _ = require('lodash'),
    moment = require('moment'),
    IndexSchema = require('../tools/schema').schema;

const ValidateStatuscheck = require('../validate/Statuscheck');

module.exports = {
    listStatuschecks: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.listStatuschecks.validate(req)
            const request = await ValidateStatuscheck.listStatuschecks.request(payload)
            return ValidateStatuscheck.listStatuschecks.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.listStatuschecks.error(err, res)
        }
    },
    getStatuscheck: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.getStatuscheck.validate(req)
            const request = await ValidateStatuscheck.getStatuscheck.request(payload)
            return ValidateStatuscheck.getStatuscheck.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.getStatuscheck.error(err, res)
        }
    },
    saveStatuscheckChanges: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.saveStatuscheckChanges.validate(req)
            const request = await ValidateStatuscheck.saveStatuscheckChanges.request(payload)
            return ValidateStatuscheck.saveStatuscheckChanges.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.saveStatuscheckChanges.error(err, res)
        }
    },
    startStatuscheck: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.startStatuscheck.validate(req)
            const request = await ValidateStatuscheck.startStatuscheck.request(payload)
            return ValidateStatuscheck.startStatuscheck.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.startStatuscheck.error(err, res)
        }
    },
    stopStatuscheck: async (req, res, next) => {
        try {
            const payload = ValidateStatuscheck.stopStatuscheck.validate(req)
            const request = await ValidateStatuscheck.stopStatuscheck.request(payload)
            return ValidateStatuscheck.stopStatuscheck.response(request, res)
        } catch (err) {
            return ValidateStatuscheck.stopStatuscheck.error(err, res)
        }
    },
}