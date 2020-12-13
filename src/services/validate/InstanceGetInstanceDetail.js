const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    S3 = require('../tools/s3').S3;
    

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
            payload.project = req.body.projectId
        }

        return payload
    },
    request: async function(payload) {
        try {

            const instance = await IndexSchema.Instance.findOne(payload, '_id stats').lean()
            if (!instance || !instance._id) throw new Error('Instance not found.')

            const stats = {}

            for (const stat of instance.stats) {

                const fullStatBuffer = await S3.getObject({
                    Bucket: process.env.STORAGE_BUCKET,
                    Key: `${payload.sub}/instance-statistics/${instance._id}/${stat}`,
                }).promise()
                const fullStat = JSON.parse(fullStatBuffer.Body)

                stats[stat] = {}

                // Add request payload
                if (!fullStat.requestSize) {
                    stats[stat].requestPayload = fullStat.requestPayload
                } else {
                    if (fullStat.requestSize < 1000) {
                        stats[stat].requestPayload = fullStat.requestPayload
                    } else {
                        stats[stat].requestPayload = 'Request payload is too large to display. Please download.'
                        stats[stat].downloadPayload = true
                    }
                }

                // Add response payload
                if (fullStat.responseSize < 1000) {
                    stats[stat].responsePayload = fullStat.responsePayload
                } else {
                    stats[stat].responsePayload = 'Response payload is too large to display. Please download.'
                    stats[stat].downloadPayload = true
                }

            }

            return stats
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing instance id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect instance id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Instance not found.') return res.status(400).send('Instance not found.')
        else {
            console.log('Get instance detail error', err)
            return res.status(500).send('Request error')
        }
    },
}