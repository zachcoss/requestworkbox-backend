const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    S3 = require('../tools/s3').S3,
    fullStatKeys = ['payloads','tasks','webhooks'];
    

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
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                instanceId = payload._id;
            
            const instance = await IndexSchema.Instance.findOne({_id: instanceId })
            if (!instance || !instance._id) throw new Error('Instance not found.')

            if (payload.projectId && instance.projectId.toString() !== payload.projectId) throw new Error('Project not found.')

            const project = await IndexSchema.Project.findOne({ _id: instance.projectId }).lean()
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
            // Requires includeSensitive permission
            if (member.permission === 'read' && !member.includeSensitive) throw new Error('Permission error.')
            
            return instance
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(instance) {
        try {

            const snapshot = {
                payloads: [],
                tasks: [],
                webhooks: [],
            }

            for (let stat of instance.stats) {

                stat = stat.toJSON()

                const fullStatBuffer = await S3.getObject({
                    Bucket: process.env.STORAGE_BUCKET,
                    Key: `${instance.projectId}/instance-statistics/${instance._id}/${stat._id}`,
                }).promise()

                let fullStat = JSON.parse(fullStatBuffer.Body)

                const 
                    taskField = fullStat.taskField || stat.taskField,
                    taskId = fullStat.taskId || stat.taskId;
                
                let snapshotItem = {
                    _id: taskId
                }

                // Add request payload
                if (!fullStat.requestSize) {
                    snapshotItem.requestPayload = fullStat.requestPayload
                } else {
                    if (fullStat.requestSize < 1000) {
                        snapshotItem.requestPayload = fullStat.requestPayload
                    } else {
                        snapshotItem.requestPayload = 'Request payload is too large to display. Please download.'
                        snapshotItem.downloadPayload = true
                    }
                }

                // Add response payload
                if (fullStat.responseSize < 1000) {
                    snapshotItem.responsePayload = fullStat.responsePayload
                } else {
                    snapshotItem.responsePayload = 'Response payload is too large to display. Please download.'
                    snapshotItem.downloadPayload = true
                }

                snapshot[taskField].push(snapshotItem)

            }

            return snapshot
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            return _.includes(fullStatKeys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Instance: get instance detail error.', err)
        return res.status(400).send(err.message)
    },
}