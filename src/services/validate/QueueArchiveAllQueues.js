const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    moment = require('moment'),
    socketService = require('../tools/socket'),
    Stats = require('../tools/stats').stats,
    keys = ['_id','active','status','stats','instanceId','workflowId','workflowName','storageInstanceId','queueType','date','createdAt','updatedAt'],
    queueStatKeys = ['_id','active','status','statusText','error','instanceId','queueId','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.workflowId) throw new Error('Missing workflow id.')
        if (!req.body.queueType) throw new Error('Missing queue type.')
        if (!req.body.date) throw new Error('Missing date.')

        if (!_.isHex(req.body.workflowId)) throw new Error('Incorrect workflow id type.')
        if (!_.includes(['queue', 'schedule', 'return', 'all'], req.body.queueType)) throw new Error('Incorrect queue type.')
        if (!moment(req.body.date).isValid()) throw new Error('Incorrect date type.')

        const 
            startDate = moment().toDate(),
            endDate = moment(req.body.date).endOf('day').toDate();

        let payload = {
            sub: req.user.sub,
            workflowId: req.body.workflowId,
            date: {
                $gt: startDate,
                $lt: endDate,
            }
        }

        if (req.body.queueType !== 'all') {
            payload.queueType = req.body.queueType
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                workflowId = payload.workflowId;
            
            const workflow = await IndexSchema.Workflow.findOne({_id: workflowId }).lean()
            if (!workflow || !workflow._id) throw new Error('Workflow not found.')

            const project = await IndexSchema.Project.findOne({ _id: workflow.projectId }).lean()
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
            
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            let queues;

            if (payload.queueType) {
                queues = await IndexSchema.Queue.find({
                    sub: payload.sub,
                    workflowId: payload.workflowId,
                    date: payload.date,
                    queueType: payload.queueType,
                })
                .sort({date: 1})
                .limit(25)
            } else {
                queues = await IndexSchema.Queue.find({
                    sub: payload.sub,
                    workflowId: payload.workflowId,
                    date: payload.date,
                })
                .sort({date: 1})
                .limit(25)
            }

            for (queue of queues) {
                await Stats.updateQueueStats({ queue, status: 'archived' }, IndexSchema, socketService)
            }

            return queues
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            let responseData = _.pickBy(request, function(value, key) {
                return _.includes(keys, key)
            })

            responseData.stats = _.map(responseData.stats, (stat) => {
                const responseData = _.pickBy(stat, function(value, key) {
                    return _.includes(queueStatKeys, key)
                })
                return responseData
            })

            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Queue: archive all queues error.', err)
        return res.status(400).send(err.message)
    },
}