const
    _ = require('lodash'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getRequests: async (req, res, next) => {
        try {
            const findPayload = { sub: req.sub, project: req.body.projectId }
            const projection = 'name method protocol url'
            const requests = await IndexSchema.Request.find(findPayload, projection)
            return res.status(200).send(requests)
        } catch (err) {
            return res.status(500).send(err)
        }
    },
}