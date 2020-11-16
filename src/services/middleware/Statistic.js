const { startCase } = require('lodash');

const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3,
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    readFile = util.promisify(fs.readFile),
    writeFile = util.promisify(fs.writeFile),
    mkdirp = require('mkdirp');

module.exports = {
    getInstances: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId, active: true }
            const projection = '-__v -usage'
            // autopopulates stats
            const instances = await IndexSchema.Instance.find(findPayload, projection).sort({createdAt: -1}).limit(5)
            return res.status(200).send(instances)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getInstance: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId, _id: req.body.instanceId, active: true }
            const projection = '-__v -usage'
            
            // autopopulates stats
            const instance = await IndexSchema.Instance.findOne(findPayload, projection)
            
            if (!instance) throw new Error('Could not find instance')
            
            return res.status(200).send([instance])
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

                // Add request payload
                if (!fullStat.requestSize) {
                    stats[stat].requestPayload = fullStat.requestPayload
                } else {
                    if (fullStat.requestSize < 1000) {
                        stats[stat].requestPayload = fullStat.requestPayload
                    } else {
                        stats[stat].requestPayload = 'Request payload is too large to display. Please download.'
                        stats[stat].downloadPayload = true
                    }
                }

                // Add response payload
                if (fullStat.responseSize < 1000) {
                    stats[stat].responsePayload = fullStat.responsePayload
                } else {
                    stats[stat].responsePayload = 'Response payload is too large to display. Please download.'
                    stats[stat].downloadPayload = true
                }

            }

            return res.status(200).send(stats)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getInstanceUsage: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.instanceId }
            const instance = await IndexSchema.Instance.findOne(findPayload, '_id usage -stats')

            return res.status(200).send(instance)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteStats: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId, active: true }
            const statDelete = await IndexSchema.Instance.updateMany(findPayload, { active: false })
            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    downloadInstanceStat: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.instanceId }
            const instance = await IndexSchema.Instance.findOne(findPayload, '_id stats')

            let statId = req.body.statId
            let statExists = false

            let requestName = ''

            for (const stat of instance.stats) {
                if (String(stat._id) === statId) {
                    statExists = true
                    requestName = stat.requestName
                }
            }

            if (!statExists) throw new Error('Could not find stat')

            const fullStatBufferStart = new Date()
            const fullStatBuffer = await S3.getObject({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/instance-statistics/${findPayload._id}/${statId}`,
            }).promise()

            const usages = [{
                sub: req.user.sub,
                usageType: 'stat',
                usageDirection: 'down',
                usageAmount: Number(fullStatBuffer.ContentLength),
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: statId,
                usageDetail: '',
                usageDetail: `Stat Download: ${requestName}`,
            }, {
                sub: req.user.sub,
                usageType: 'stat',
                usageDirection: 'time',
                usageAmount: Number(new Date() - fullStatBufferStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: statId,
                usageDetail: `Stat Download: ${requestName}`,
            }]

            await Stats.updateInstanceUsage({ instance, usages, }, IndexSchema)

            const directoryPath = `./files/downloads/${statId}`
            const filePath = path.resolve(`${directoryPath}/${statId}`)

            await mkdirp(directoryPath)
            await writeFile(filePath, fullStatBuffer.Body)

            return res.sendFile(filePath)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}