const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3;
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.query.storageId) throw new Error('Missing storage id in query parameters.')
        if (!req.body.storageValue) throw new Error('Missing storage value.')
        if (!_.isString(req.body.storageValue)) throw new Error('Incorrect storage value type.')
        if (!_.isHex(req.query.storageId)) throw new Error('Incorrect storage id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.query.storageId,
            storageValue: req.body.storageValue,
        }

        if (req.body.projectId) {
            if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
            payload.project = req.body.projectId
        }

        return payload
    },
    request: async function(payload) {
        try {

            let storage;

            if (payload.project) {
                storage = await IndexSchema.Storage.findOne({
                    sub: payload.sub,
                    _id: payload._id,
                    project: payload.project,
                })
                if (!storage || !storage._id) throw new Error('Storage not found.')
            } else {
                storage = await IndexSchema.Storage.findOne({
                    sub: payload.sub,
                    _id: payload._id,
                })
                if (!storage || !storage._id) throw new Error('Storage not found.')
            }

            const textDataStart = new Date()
            const textData = Buffer.from(payload.storageValue, 'utf8')

            await S3.upload({
                Bucket: process.env.STORAGE_BUCKET,
                Key: `${storage.sub}/storage/${storage._id}`,
                Body: textData
            }).promise()

            const textDataSize = Number(textData.byteLength)
            storage['size'] = textDataSize

            const usages = [{
                sub: storage.sub,
                usageType: 'storage',
                usageDirection: 'up',
                usageAmount: textDataSize,
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: storage._id,
            }, {
                sub: storage.sub,
                usageType: 'storage',
                usageDirection: 'time',
                usageAmount: Number(new Date() - textDataStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: storage._id,
            }]

            await Stats.updateStorageUsage({ storage, usages, }, IndexSchema)

            storage.storageValue = String(textData)
            return storage
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            const keys = ['_id','active','name','project','storageType','storageValue','mimetype','originalname','size','createdAt','updatedAt']
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing storage id in query parameters.') return res.status(400).send(err.message)
        else if (err.message === 'Missing storage value.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect storage value type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect storage id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Storage not found.') return res.status(400).send('Storage not found.')
        else if (err.message === 'NoSuchKey: The specified key does not exist.') return res.status(400).send('No storage value.')
        else {
            console.log('Update text storage data error', err.message)
            return res.status(500).send('Request error')
        }
    },
}