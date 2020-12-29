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

        if (!req.body.instanceId) throw new Error('Missing instance id.')
        if (!_.isHex(req.body.instanceId)) throw new Error('Incorrect instance id type.')

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
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                instanceId = payload._id;
            
            const instance = await IndexSchema.Instance.findOne({_id: instanceId }, '_id usage -stats')
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
            
            return instance
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(instance) {
        try {
            return instance.toJSON()
        } catch(err) {
            throw new Error(err.message)
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
        console.log('Instance: get instance usage error.', err)
        return res.status(400).send(err.message)
    },
}