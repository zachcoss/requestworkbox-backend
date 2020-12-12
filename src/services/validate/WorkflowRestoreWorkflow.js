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
        if (!req.body.workflowId) throw new Error('Missing workflow id.')
        if (!_.isHex(req.body.workflowId)) throw new Error('Incorrect workflow id type.')

        const payload = {
            sub: req.user.sub,
            _id: req.body.workflowId,
        }

        return payload
    },
    request: async function(payload) {
        try {

            const workflow = await IndexSchema.Workflow.findOne(payload)

            if (!workflow || !workflow._id) throw new Error('Workflow not found.')

            workflow.active = true
            await workflow.save()

            return workflow
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','active','name','project','tasks','webhookRequestId','createdAt','updatedAt']
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
            console.log('Restore workflow error', err)
            return res.status(500).send('Request error')
        }
    },
}