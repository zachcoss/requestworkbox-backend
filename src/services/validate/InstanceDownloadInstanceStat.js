const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3,
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    writeFile = util.promisify(fs.writeFile),
    mkdirp = require('mkdirp'),
    statKeys = ['_id','active','requestName','requestType','requestId','instanceId','status','statusText','startTime','endTime','duration','responseSize','taskId','taskField','createdAt','updatedAt'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.instanceId) throw new Error('Missing instance id.')
        if (!req.body.statId) throw new Error('Missing stat id.')
        if (!_.isHex(req.body.instanceId)) throw new Error('Incorrect instance id type.')
        if (!_.isHex(req.body.statId)) throw new Error('Incorrect stat id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body.instanceId,
            statId: req.body.statId,
        }

        if (req.body.projectId) {
            if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
            payload.projectId = req.body.projectId
        }

        return payload
    },
    request: async function(payload) {
        try {

            let instance;

            if (payload.projectId) {
                instance = await IndexSchema.Instance.findOne({
                    sub: payload.sub,
                    _id: payload._id,
                    projectId: payload.projectId,
                }, '_id stats')
            } else {
                instance = await IndexSchema.Instance.findOne({
                    sub: payload.sub,
                    _id: payload._id,
                }, '_id stats')
            }

            if (!instance || !instance._id) throw new Error('Instance not found.')

            let 
                statId = payload.statId,
                statExists = false,
                requestName = '';

            for (const stat of instance.stats) {
                if (String(stat._id) === statId) {
                    statExists = true
                    requestName = stat.requestName
                }
            }

            if (!statExists) throw new Error('Stat not found.')

            const fullStatBufferStart = new Date()
            const fullStatBuffer = await S3.getObject({
                Bucket: process.env.STORAGE_BUCKET,
                Key: `${payload.sub}/instance-statistics/${instance._id}/${statId}`,
            }).promise()

            let bufferBodyJSON = fullStatBuffer.Body.toJSON()
            bufferBodyJSON = _.pickBy(bufferBodyJSON, function(value, key) {
                return _.includes(statKeys, key)
            })

            const finalBufferBody = Buffer.from(JSON.stringify(bufferBodyJSON))

            const usages = [{
                sub: payload.sub,
                usageType: 'stat',
                usageDirection: 'down',
                usageAmount: Number(fullStatBuffer.ContentLength),
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: statId,
                usageDetail: '',
                usageDetail: `Stat Download: ${requestName}`,
            }, {
                sub: payload.sub,
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
            await writeFile(filePath, finalBufferBody)

            return filePath
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        return res.sendFile(request)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing instance id.') return res.status(400).send(err.message)
        else if (err.message === 'Missing stat id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect instance id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect stat id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Instance not found.') return res.status(400).send('Instance not found.')
        else if (err.message === 'Error: Stat not found.') return res.status(400).send('Stat not found.')
        else {
            console.log('Download instance stat error', err)
            return res.status(500).send('Request error')
        }
    },
}