const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    moment = require('moment'),
    keys = ['_id','active','status','stats','instanceId','workflowId','workflowName','storageInstanceId','queueType','statuscheckId','date','createdAt','updatedAt'],
    queueStatKeys = ['_id','active','status','statusText','error','instanceId','queueId','createdAt','updatedAt'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.workflowId) throw new Error('Missing workflow id.')
        if (!_.isHex(req.body.workflowId)) throw new Error('Incorrect workflow id type.')

        let payload = {
            sub: req.user.sub,
            workflowId: req.body.workflowId,
            queueType: { $nin: ['statuscheck'] },
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
    request: async function(payload) {
        try {

            const queues = await IndexSchema.Queue.find(payload)
            .sort({createdAt: -1})
            .limit(25)

            return queues
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
                    return _.includes(queueStatKeys, key)
                })
                return responseData
            })

            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing workflow id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect workflow id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect date type.') return res.status(400).send(err.message)
        else {
            console.log('List Queues error', err)
            return res.status(500).send('Request error')
        }
    },
}