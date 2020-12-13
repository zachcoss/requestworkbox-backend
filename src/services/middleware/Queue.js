const 
    ValidateQueue = require('../validate/Queue');

module.exports = {
    listQueues: async (req, res, next) => {
        try {
            const payload = ValidateQueue.listQueues.validate(req)
            const request = await ValidateQueue.listQueues.request(payload)
            return ValidateQueue.listQueues.response(request, res)
        } catch (err) {
            return ValidateQueue.listQueues.error(err, res)
        }
    },
    archiveAllQueues: async (req, res, next) => {
        try {
            const payload = ValidateQueue.archiveAllQueues.validate(req)
            const request = await ValidateQueue.archiveAllQueues.request(payload)
            return ValidateQueue.archiveAllQueues.response(request, res)
        } catch (err) {
            return ValidateQueue.archiveAllQueues.error(err, res)
        }
    },
    archiveQueue: async (req, res, next) => {
        try {
            const payload = ValidateQueue.archiveQueue.validate(req)
            const request = await ValidateQueue.archiveQueue.request(payload)
            return ValidateQueue.archiveQueue.response(request, res)
        } catch (err) {
            return ValidateQueue.archiveQueue.error(err, res)
        }
    },
}