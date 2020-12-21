const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.webhookId) throw new Error('Missing webhook id.')
        if (!_.isHex(req.body.webhookId)) throw new Error('Incorrect webhook id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body.webhookId,
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
                webhookId = payload._id;

            const webhook = await IndexSchema.Webhook.findOne({ _id: webhookId })
            if (!webhook || !webhook._id) throw new Error('Webhook not found.')

            if (payload.projectId && payload.projectId !== webhook._id.toString()) throw new Error('Project not found.')

            const project = await IndexSchema.Project.findOne({ _id: webhook.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            
            return webhookDetail
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function(payload) {
        try {

            const webhook = await IndexSchema.Webhook.findOne(payload)
            if (!webhook || !webhook._id) throw new Error('Webhook not found.')
            
            return webhook
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','active','projectId','name','createdAt','updatedAt']
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing webhook id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect webhook id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Webhook not found.') return res.status(400).send('Webhook not found.')
        else {
            console.log('Get webhook error', err)
            return res.status(500).send('Request error')
        }
    },
}