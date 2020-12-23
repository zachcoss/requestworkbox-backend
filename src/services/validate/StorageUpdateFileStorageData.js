const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    util = require('util'),
    fs = require('fs'),
    readFile = util.promisify(fs.readFile),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3,
    keys = ['_id','active','name','projectId','storageType','storageValue','mimetype','originalname','size','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','sensitiveData'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.query.storageId) throw new Error('Missing storage id in query parameters.')
        if (!req.file || !req.file.path) throw new Error('Missing file path.')
        if (!_.isString(req.file.path)) throw new Error('Incorrect file path type.')
        if (!_.isHex(req.query.storageId)) throw new Error('Incorrect storage id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.query.storageId,
            file: req.file,
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
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return {storage, payload}
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function({storage, payload}) {
        try {

            const fileDataStart = new Date()
            const file = await readFile(payload.file.path, 'utf8')

            await S3.upload({
                Bucket: process.env.STORAGE_BUCKET,
                Key: `${storage.projectId}/storage-data/${storage._id}`,
                Body: file
            }).promise()

            _.each(payload.file, (value, key) => {
                storage[key] = value
            })
            const fileDataSize = Number(payload.file.size)
            storage['size'] = fileDataSize

            const usages = [{
                sub: storage.sub,
                usageType: 'storage',
                usageDirection: 'up',
                usageAmount: fileDataSize,
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: storage._id,
            }, {
                sub: storage.sub,
                usageType: 'storage',
                usageDirection: 'time',
                usageAmount: Number(new Date() - fileDataStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: storage._id,
            }]

            await Stats.updateStorageUsage({ storage, usages, }, IndexSchema)

            return storage.toJSON()
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing storage id in query parameters.') return res.status(400).send(err.message)
        else if (err.message === 'Missing file path.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect file path type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect storage id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Storage not found.') return res.status(400).send('Storage not found.')
        else if (err.message === 'NoSuchKey: The specified key does not exist.') return res.status(400).send('No storage value.')
        else {
            console.log('Update file storage data error', err.message)
            return res.status(500).send('Request error')
        }
    },
}