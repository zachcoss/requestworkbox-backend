const 
    ValidateInstance = require('../validate/Instance');

module.exports = {
    listInstances: async (req, res, next) => {
        try {
            const payload = ValidateInstance.listInstances.validate(req)
            const request = await ValidateInstance.listInstances.request(payload)
            return ValidateInstance.listInstances.response(request, res)
        } catch (err) {
            return ValidateInstance.listInstances.error(err, res)
        }
    },
    getInstance: async (req, res, next) => {
        try {
            const payload = ValidateInstance.getInstance.validate(req)
            const request = await ValidateInstance.getInstance.request(payload)
            return ValidateInstance.getInstance.response(request, res)
        } catch (err) {
            return ValidateInstance.getInstance.error(err, res)
        }
    },
    getInstanceDetail: async (req, res, next) => {
        try {
            const payload = ValidateInstance.getInstanceDetail.validate(req)
            const request = await ValidateInstance.getInstanceDetail.request(payload)
            return ValidateInstance.getInstanceDetail.response(request, res)
        } catch (err) {
            return ValidateInstance.getInstanceDetail.error(err, res)
        }
    },
    getInstanceUsage: async (req, res, next) => {
        try {
            const payload = ValidateInstance.getInstanceUsage.validate(req)
            const request = await ValidateInstance.getInstanceUsage.request(payload)
            return ValidateInstance.getInstanceUsage.response(request, res)
        } catch (err) {
            return ValidateInstance.getInstanceUsage.error(err, res)
        }
    },
    downloadInstanceStat: async (req, res, next) => {
        try {
            const payload = ValidateInstance.downloadInstanceStat.validate(req)
            const request = await ValidateInstance.downloadInstanceStat.request(payload)
            return ValidateInstance.downloadInstanceStat.response(request, res)
        } catch (err) {
            return ValidateInstance.downloadInstanceStat.error(err, res)
        }
    },
}