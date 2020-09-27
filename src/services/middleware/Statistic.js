const { startCase } = require('lodash');

const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema'),
    S3 = require('../tools/s3').S3;

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
    },
    getInstanceDetail: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.instanceId }
            const instance = await IndexSchema.Instance.findOne(findPayload, '_id stats').lean()
            const stats = {}

            // pull instance request / response data from S3
            for (const stat of instance.stats) {

                const fullStatBuffer = await S3.getObject({
                    Bucket: "connector-storage",
                    Key: `${findPayload.sub}/instance-statistics/${findPayload._id}/${stat}`,
                }).promise()
                const fullStat = JSON.parse(fullStatBuffer.Body)

                stats[stat] = {}
                stats[stat].requestPayload = fullStat.requestPayload
                stats[stat].responsePayload = fullStat.responsePayload
            }

            return res.status(200).send(stats)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}