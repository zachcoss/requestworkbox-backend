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
    usageKeys = ['_id','active','usageType','usageDirection','usageAmount','usageMeasurement','usageLocation','usageId','usageDetail','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.webhookDetailId) throw new Error('Missing webhook detail id.')
        if (!_.isHex(req.body.webhookDetailId)) throw new Error('Incorrect webhook detail id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body.webhookDetailId,
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
                webhookDetailId = payload._id;

            const webhookDetail = await IndexSchema.WebhookDetail.findOne({ _id: webhookDetailId })
            if (!webhookDetail || !webhookDetail._id) throw new Error('Webhook detail not found.')

            if (payload.projectId && payload.projectId !== webhookDetail._id.toString()) throw new Error('Project not found.')

            const project = await IndexSchema.Project.findOne({ _id: webhookDetail.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.status !== 'write') throw new Error('Permission error.')
            
            return webhookDetail
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function(webhookDetail) {
        try {

            const webhookDetailBufferStart = new Date()
            const webhookDetailBuffer = await S3.getObject({
                Bucket: process.env.STORAGE_BUCKET,
                Key: `${webhookDetail.sub}/webhook-payloads/${webhookDetail._id}`,
            }).promise()

            const usages = [{
                sub: webhookDetail.sub,
                usageType: 'webhook',
                usageDirection: 'down',
                usageAmount: webhookDetailBuffer.ContentLength,
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: webhookDetail._id,
            }, {
                sub: webhookDetail.sub,
                usageType: 'webhook',
                usageDirection: 'time',
                usageAmount: Number(new Date() - webhookDetailBufferStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: webhookDetail._id,
            }]

            await Stats.updateWebhookDetailUsage({ webhookDetail, usages, }, IndexSchema)

            const directoryPath = `./files/downloads/${webhookDetail._id}`
            const filePath = path.resolve(`${directoryPath}/${webhookDetail._id}`)

            await mkdirp(directoryPath)
            await writeFile(filePath, webhookDetailBuffer.Body)

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
        else if (err.message === 'Missing webhook detail id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect webhook detail id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Webhook detail not found.') return res.status(400).send('Webhook detail not found.')
        else {
            console.log('Download webhook detail error', err)
            return res.status(500).send('Request error')
        }
    },
}