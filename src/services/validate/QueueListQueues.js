const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    moment = require('moment'),
    keys = ['_id','active','status','stats','instanceId','workflowId','workflowName','storageInstanceId','queueType','date','createdAt','updatedAt'],
    queueStatKeys = ['_id','active','status','statusText','error','instanceId','queueId','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.workflowId) throw new Error('Missing workflow id.')
        if (!_.isHex(req.body.workflowId)) throw new Error('Incorrect workflow id type.')

        let payload = {
            sub: req.user.sub,
            workflowId: req.body.workflowId,
        }

        if (req.body.date) {
            if (!moment(req.body.date).isValid()) throw new Error('Incorrect date type.')

            const 
                startDate = moment(req.body.date).startOf('day').toDate(),
                endDate = moment(req.body.date).endOf('day').toDate();

            payload.date = {
                $gt: startDate,
                $lt: endDate,
            }
        } else {
            const 
                startDate = moment().startOf('day').toDate(),
                endDate = moment().endOf('day').toDate();

            payload.date = {
                $gt: startDate,
                $lt: endDate,
            }
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                workflowId = payload.workflowId;
            
            const workflow = await IndexSchema.Workflow.findOne({_id: workflowId })
            if (!workflow || !workflow._id) throw new Error('Workflow not found.')

            const project = await IndexSchema.Project.findOne({ _id: workflow.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Requires read permissions
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission !== 'read' && 
                member.permission !== 'write' ) throw new Error('Permission error.')
            
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            const queues = await IndexSchema.Queue.find({
                sub: payload.sub,
                workflowId: payload.workflowId,
                queueType: payload.queueType,
                date: payload.date,
            })
            .sort({date: 1})
            .limit(25)
            .lean()

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
        console.log('Queue: list queues error.', err)
        return res.status(400).send(`Queue: list queues error. ${err.message}`)
    },
}