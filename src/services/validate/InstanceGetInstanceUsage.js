const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    // includes usage and no stats
    keys = ['_id','active','projectId','workflowId','workflowName','queueType','queueId','usage','totalMs','totalBytesDown','totalBytesUp','createdAt','updatedAt'],
    usageKeys = ['_id','active','usageType','usageDirection','usageAmount','usageMeasurement','usageLocation','usageId','usageDetail','createdAt','updatedAt'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')

        if (!req.body.instanceId) {
            throw new Error('Missing instance id.')
        } else {
            if (!_.isHex(req.body.instanceId)) throw new Error('Incorrect instance id type.')
        }

        let payload = {
            sub: req.user.sub,
            _id: req.body.instanceId,
        }

        if (req.body.projectId) {
            if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
            payload.projectId = req.body.projectId
        }

        return payload
    },
    request: async function(payload) {
        try {

            const instance = await IndexSchema.Instance.findOne(payload, '_id usage -stats')
            if (!instance || !instance._id) throw new Error('Instance not found.')

            return instance
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys, key)
        })

        response.usage = _.map(response.usage, (usage) => {
            const responseData = _.pickBy(usage, function(value, key) {
                return _.includes(usageKeys, key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing instance id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect instance id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Instance not found.') return res.status(400).send('Instance not found.')
        else {
            console.log('Get instance usage error', err)
            return res.status(500).send('Request error')
        }
    },
}