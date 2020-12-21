const 
    ValidateQueue = require('../validate/Queue');

module.exports = {
    listQueues: async (req, res, next) => {
        try {
            const payload = ValidateQueue.listQueues.validate(req)
            const authorize = await ValidateQueue.listQueues.authorize(payload)
            const request = await ValidateQueue.listQueues.request(authorize)
            return ValidateQueue.listQueues.response(request, res)
        } catch (err) {
            return ValidateQueue.listQueues.error(err, res)
        }
    },
    archiveAllQueues: async (req, res, next) => {
        try {
            const payload = ValidateQueue.archiveAllQueues.validate(req)
            const authorize = await ValidateQueue.archiveAllQueues.authorize(payload)
            const request = await ValidateQueue.archiveAllQueues.request(authorize)
            return ValidateQueue.archiveAllQueues.response(request, res)
        } catch (err) {
            return ValidateQueue.archiveAllQueues.error(err, res)
        }
    },
    archiveQueue: async (req, res, next) => {
        try {
            const payload = ValidateQueue.archiveQueue.validate(req)
            const authorize = await ValidateQueue.archiveQueue.authorize(payload)
            const request = await ValidateQueue.archiveQueue.request(authorize)
            return ValidateQueue.archiveQueue.response(request, res)
        } catch (err) {
            return ValidateQueue.archiveQueue.error(err, res)
        }
    },
}