const 
    ValidateInstance = require('../validate/Instance');

module.exports = {
    listInstances: async (req, res, next) => {
        try {
            const payload = ValidateInstance.listInstances.validate(req)
            const authorize = await ValidateInstance.listInstances.authorize(payload)
            const request = await ValidateInstance.listInstances.request(authorize)
            return ValidateInstance.listInstances.response(request, res)
        } catch (err) {
            return ValidateInstance.listInstances.error(err, res)
        }
    },
    getInstance: async (req, res, next) => {
        try {
            const payload = ValidateInstance.getInstance.validate(req)
            const authorize = await ValidateInstance.getInstance.authorize(payload)
            const request = await ValidateInstance.getInstance.request(authorize)
            return ValidateInstance.getInstance.response(request, res)
        } catch (err) {
            return ValidateInstance.getInstance.error(err, res)
        }
    },
    getInstanceDetail: async (req, res, next) => {
        try {
            const payload = ValidateInstance.getInstanceDetail.validate(req)
            const authorize = await ValidateInstance.getInstanceDetail.authorize(payload)
            const request = await ValidateInstance.getInstanceDetail.request(authorize)
            return ValidateInstance.getInstanceDetail.response(request, res)
        } catch (err) {
            return ValidateInstance.getInstanceDetail.error(err, res)
        }
    },
    getInstanceUsage: async (req, res, next) => {
        try {
            const payload = ValidateInstance.getInstanceUsage.validate(req)
            const authorize = await ValidateInstance.getInstanceUsage.authorize(payload)
            const request = await ValidateInstance.getInstanceUsage.request(authorize)
            return ValidateInstance.getInstanceUsage.response(request, res)
        } catch (err) {
            return ValidateInstance.getInstanceUsage.error(err, res)
        }
    },
    downloadInstanceStat: async (req, res, next) => {
        try {
            const payload = ValidateInstance.downloadInstanceStat.validate(req)
            const authorize = await ValidateInstance.downloadInstanceStat.authorize(payload)
            const request = await ValidateInstance.downloadInstanceStat.request(authorize)
            return ValidateInstance.downloadInstanceStat.response(request, res)
        } catch (err) {
            return ValidateInstance.downloadInstanceStat.error(err, res)
        }
    },
}