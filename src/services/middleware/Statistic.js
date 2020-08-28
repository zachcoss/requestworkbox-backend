const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getInstances: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v'
            // autopopulates stats
            const instances = await IndexSchema.Instance.find(findPayload, projection)
            return res.status(200).send(instances)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    }
}