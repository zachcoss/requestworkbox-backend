const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','tasks','webhookRequestId','createdAt','updatedAt'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing workflow id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect workflow id type.')

        let updates = _.pick(req.body, ['_id','name','tasks','webhookRequestId'])

        updates.sub = req.user.sub
        return updates
    },
    request: async function(payload) {
        try {

            const workflow = await IndexSchema.Workflow.findOne({
                sub: payload.sub,
                _id: payload._id,
            })

            if (!workflow || !workflow._id) throw new Error('Workflow not found.')

            const updates = _.omit(payload, ['_id', 'sub'])

            _.each(updates, (value, key) => {
                workflow[key] = value
            })

            if (!updates.webhookRequestId || updates.webhookRequestId === '') {
                workflow.webhookRequestId = undefined
            }

            await workflow.save()
            return workflow
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing workflow id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect workflow id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Workflow not found.') return res.status(400).send('Workflow not found.')
        else {
            console.log('Save workflow changes error', err)
            return res.status(500).send('Request error')
        }
    },
}