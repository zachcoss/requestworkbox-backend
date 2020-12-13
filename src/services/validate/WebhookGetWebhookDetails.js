const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    moment = require('moment');

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.webhookId) throw new Error('Missing webhook id.')
        if (!req.body.date) throw new Error('Missing date.')
        if (!_.isHex(req.body.webhookId)) throw new Error('Incorrect webhook id type.')
        if (!moment(req.body.date).isValid()) throw new Error('Incorrect date type.')

        const 
            startDate = moment(req.body.date).startOf('day').toDate(),
            endDate = moment(req.body.date).endOf('day').toDate();

        let payload = {
            sub: req.user.sub,
            webhookId: req.body.webhookId,
            createdAt: {
                $gt: startDate,
                $lt: endDate,
            }
        }

        return payload
    },
    request: async function(payload) {
        try {

            const webhookDetails = await IndexSchema.WebhookDetail.find(payload)
            .sort({createdAt: -1})
            .limit(10)

            return webhookDetails
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            const responseData = _.pickBy(request, function(value, key) {
                const keys = ['_id','active','projectId','webhookId','id','payloadSize','payloadType','createdAt','updatedAt']
                return _.includes(keys, key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing webhook id.') return res.status(400).send(err.message)
        else if (err.message === 'Missing date.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect webhook id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect date type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Webhook not found.') return res.status(400).send('Webhook not found.')
        else {
            console.log('Get webhook details error', err)
            return res.status(500).send('Request error')
        }
    },
}