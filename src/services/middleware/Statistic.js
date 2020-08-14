const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getInstances: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v'
            const instances = await IndexSchema.Instance.find(findPayload, projection)
            return res.status(200).send(instances)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getStatistics: async (req, res, next) => {
        try {
            const findInstancePayload = { sub: req.user.sub, _id: req.body.instanceId }
            const instance = await IndexSchema.Instance.findOne(findInstancePayload)

            const findStatisticsPayload = { instance: instance._id }
            const projection = '-__v'
            const statistics = await IndexSchema.Stat.find(findStatisticsPayload, projection)
            return res.status(200).send(statistics)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}