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
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                instanceId = payload._id;
            
            const instance = await IndexSchema.Instance.findOne({_id: instanceId })
            if (!instance || !instance._id) throw new Error('Instance not found.')

            if (payload.projectId && instance.projectId.toString() !== payload.projectId) throw new Error('Project not found.')

            const project = await IndexSchema.Project.findOne({ _id: instance.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Requires write permissions
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return {payload, instance}
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({payload, instance}) {
        try {
            
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
                Key: `${instance.projectId}/instance-statistics/${instance._id}/${statId}`,
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
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.sendFile(request)
    },
    error: function(err, res) {
        console.log('Instance: download instance stat error.', err)
        return res.status(400).send(err.message)
    },
}