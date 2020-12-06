const
    _ = require('lodash'),
    moment = require('moment'),
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
    newWebhook: async (req, res, next) => {
        if (!req.body.projectId) throw new Error('Missing project')

        try {
            const webhook = new IndexSchema.Webhook({ sub: req.user.sub, projectId: req.body.projectId })
            await webhook.save()

            return res.status(200).send(webhook)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getWebhooks: async (req, res, next) => {
        if (!req.body.projectId) throw new Error('Missing project')

        try {
            const webhooks = await IndexSchema.Webhook.find({ sub: req.user.sub, projectId: req.body.projectId })

            return res.status(200).send(webhooks)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getWebhook: async (req, res, next) => {
        try {
            if (!req.body.webhookId) throw new Error('Missing webhook id')

            const findPayload = { sub: req.user.sub, _id: req.body.webhookId }
            const projection = '-__v'
            
            const webhook = await IndexSchema.Webhook.findOne(findPayload, projection)
            
            if (!webhook) throw new Error('Could not find webhook')
            
            return res.status(200).send(webhook)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    saveWebhookChanges: async (req, res, next) => {
        try {
            if (!req.body._id) throw new Error('Missing webhook id')

            const updates = _.pick(req.body, ['name'])

            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const webhook = await IndexSchema.Webhook.findOne(findPayload)

            _.each(updates, (value, key) => {
                webhook[key] = value
            })
            
            await webhook.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getWebhookDetails: async (req, res, next) => {
        if (!req.body.date) throw new Error('Missing date')
        if (!req.body.webhookId) throw new Error('Missing webhook id')

        try {
            const startDate = moment(req.body.date).startOf('day').toDate()
            const endDate = moment(req.body.date).endOf('day').toDate()
            const findPayload = {
                sub: req.user.sub,
                webhookId: req.body.webhookId,
                createdAt: {
                    $gt: startDate,
                    $lt: endDate,
                }
            }

            const webhookDetails = await IndexSchema.WebhookDetail.find(findPayload)

            return res.status(200).send(webhookDetails)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    acceptWebhook: async (req, res, next) => {
        if (!req.params.webhookId) throw new Error('Missing webhook id')

        const webhookId = req.params.webhookId.trim()
        const id = req.query.id || ''

        try {
            const webhook = await IndexSchema.Webhook.findOne({ _id: webhookId })

            if (!webhook || !webhook._id) throw new Error('Webhook not found')

            const webhookDetail = new IndexSchema.WebhookDetail({
                sub: webhook.sub,
                projectId: webhook.projectId,
                webhookId: webhook._id,
                id,
            })

            if (!req.headers['content-type']) {
                await webhookDetail.save()
            } else if (req.headers['content-type'] === 'application/json') {
                const webhookPayloadStart = new Date()
                const webhookPayload = Buffer.from(JSON.stringify(req.body), 'utf8')
                const webhookPayloadSize = Number(webhookPayload.byteLength)

                webhookDetail.payloadSize = webhookPayloadSize
                webhookDetail.payloadType = req.headers['content-type']

                await webhookDetail.save()

                await S3.upload({
                    Bucket: process.env.STORAGE_BUCKET,
                    Key: `${webhook.sub}/webhook-payloads/${webhookDetail._id}`,
                    Body: webhookPayload
                }).promise()

                const usages = [{
                    sub: webhook.sub,
                    usageType: 'webhook',
                    usageDirection: 'up',
                    usageAmount: webhookPayloadSize,
                    usageMeasurement: 'byte',
                    usageLocation: 'api',
                    usageId: webhookDetail._id,
                }, {
                    sub: webhook.sub,
                    usageType: 'webhook',
                    usageDirection: 'time',
                    usageAmount: Number(new Date() - webhookPayloadStart),
                    usageMeasurement: 'ms',
                    usageLocation: 'api',
                    usageId: webhookDetail._id,
                }]

                await Stats.updateWebhookDetailUsage({ webhookDetail, usages, }, IndexSchema)
            } else {
                throw new Error('Only JSON payloads accepted')
            }

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    downloadWebhookDetail: async (req, res, next) => {
        try {
            if (!req.body.webhookDetailId) throw new Error('Missing webhook detail id')

            const findPayload = { sub: req.user.sub, _id: req.body.webhookDetailId }
            const webhookDetail = await IndexSchema.WebhookDetail.findOne(findPayload)

            if (!webhookDetail || !webhookDetail._id) throw new Error('Could not find webhook detail')

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

            return res.sendFile(filePath)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}