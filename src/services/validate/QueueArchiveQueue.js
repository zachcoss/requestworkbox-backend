const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    socketService = require('../tools/socket'),
    Stats = require('../tools/stats').stats,
    keys = ['_id','active','status','stats','instanceId','workflowId','workflowName','storageInstanceId','queueType','date','createdAt','updatedAt'],
    queueStatKeys = ['_id','active','status','statusText','error','instanceId','queueId','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.queueId) throw new Error('Missing queue id.')
        if (!_.isHex(req.body.queueId)) throw new Error('Incorrect queue id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body.queueId,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                queueId = payload._id;
            
            const queue = await IndexSchema.Queue.findOne({_id: queueId })
            if (!queue || !queue._id) throw new Error('Queue not found.')

            const instance = await IndexSchema.Instance.findOne({ _id: queue.instanceId })
            if (!instance || !instance._id) throw new Error('Instance not found.')

            const project = await IndexSchema.Project.findOne({ _id: instance.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Requires owner permission
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (!member.owner) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return queue
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(queue) {
        try {

            await Stats.updateQueueStats({ queue, status: 'archived' }, IndexSchema, socketService)

            return queue.toJSON()
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys, key)
        })

        response.stats = _.map(response.stats, (stat) => {
            const responseData = _.pickBy(stat, function(value, key) {
                return _.includes(queueStatKeys, key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Queue: archive queue error.', err)
        return res.status(400).send(err.message)
    },
}