const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3,
    keys = ['_id','active','name','projectId','storageType','storageValue','mimetype','originalname','size','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.query.storageId) throw new Error('Missing storage id in query parameters.')
        if (!req.body.storageValue) throw new Error('Missing storage value.')
        if (!_.isString(req.body.storageValue)) throw new Error('Incorrect storage value type.')
        if (!_.isHex(req.query.storageId)) throw new Error('Incorrect storage id type.')

        // check storage value size
        if (Buffer.byteLength(req.body.storageValue) > 1000000) throw new Error('1MB max allowed.')

        let payload = {
            sub: req.user.sub,
            _id: req.query.storageId,
            storageValue: req.body.storageValue,
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
                storageId = payload._id;
            
            const storage = await IndexSchema.Storage.findOne({ _id: storageId })
            if (!storage || !storage._id) throw new Error('Storage not found.')

            if (payload.projectId && payload.projectId !== storage.projectId.toString()) throw new Error('Project not found.')

            const project = await IndexSchema.Project.findOne({ _id: storage.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (_.isBoolean(storage.lockedResource) && storage.lockedResource && !member.owner) throw new Error('Permission error.')

            // Requires write permissions
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return {storage, payload}
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({storage, payload}) {
        try {

            const textDataStart = new Date()
            const textData = Buffer.from(payload.storageValue, 'utf8')

            await S3.upload({
                Bucket: process.env.STORAGE_BUCKET,
                Key: `${storage.projectId}/storage-data/${storage._id}`,
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
            return storage.toJSON()
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Storage: update text storage data error.', err)
        return res.status(400).send(err.message)
    },
}