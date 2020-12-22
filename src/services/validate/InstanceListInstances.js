const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','projectId','workflowId','workflowName','queueType','queueId','stats','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'],
    statKeys = ['_id','active','requestName','requestType','requestId','instanceId','status','statusText','startTime','endTime','duration','responseSize','taskId','taskField','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')

        let payload = {
            sub: req.user.sub,
            projectId: req.body.projectId,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                projectId = payload.projectId;
            
            const project = await IndexSchema.Project.findOne({ _id: projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            
            return payload
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function(payload) {
        try {

            const instances = await IndexSchema.Instance.find({
                projectId: payload.projectId,
            })
            .sort({createdAt: -1})
            .limit(5)
            .lean()

            return instances
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            let responseData = _.pickBy(request, function(value, key) {
                return _.includes(keys, key)
            })

            responseData.stats = _.map(responseData.stats, (stat) => {
                const responseData = _.pickBy(stat, function(value, key) {
                    return _.includes(statKeys, key)
                })
                return responseData
            })

            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing project id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else {
            console.log('List instances error', err)
            return res.status(500).send('Request error')
        }
    },
}