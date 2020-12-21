const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3;

module.exports = {
    validate: function(req, res) {

        if (!req.params.webhookId) throw new Error('Missing webhook id.')
        if (!_.isHex(req.params.webhookId)) throw new Error('Incorrect webhook id type.')

        let payload = {
            _id: req.params.webhookId.trim(),
            contentType: req.headers['content-type'],
        }
        
        if (req.query.id) {
            if (!_.isString(req.query.id)) throw new Error('Incorrect id type.')
            payload.id = req.query.id.trim()
        }

        if (req.body) {
            // check storage value size
            if (Buffer.byteLength(JSON.stringify(req.body)) > 1000000) throw new Error('1MB max allowed.')
            payload.body = req.body
        }

        return payload
    },
    request: async function(payload) {
        try {

            const webhook = await IndexSchema.Webhook.findOne({
                _id: payload._id
            })
            if (!webhook || !webhook._id) throw new Error('Webhook not found.')

            const id = payload.id || '';

            const webhookDetail = new IndexSchema.WebhookDetail({
                sub: webhook.sub,
                projectId: webhook.projectId,
                webhookId: webhook._id,
                id,
            })

            if (!payload.contentType) {
                await webhookDetail.save()
            } else if (payload.contentType === 'application/json') {
                const webhookPayloadStart = new Date()
                const webhookPayload = Buffer.from(JSON.stringify(payload.body), 'utf8')
                const webhookPayloadSize = Number(webhookPayload.byteLength)

                webhookDetail.payloadSize = webhookPayloadSize
                webhookDetail.payloadType = payload.contentType

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
                throw new Error('Only JSON payloads accepted.')
            }
            
            return 'OK'
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing webhook id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect webhook id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Only JSON payloads accepted.') return res.status(400).send('Only JSON payloads accepted.')
        else if (err.message === 'Error: Webhook not found.') return res.status(400).send('Webhook not found.')
        else {
            console.log('Accept webhook error', err)
            return res.status(500).send('Request error')
        }
    },
}