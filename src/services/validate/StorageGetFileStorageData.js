const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    writeFile = util.promisify(fs.writeFile),
    mkdirp = require('mkdirp'),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3;
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')

        if (!req.body.storageId) {
            throw new Error('Missing storage id.')
        } else {
            if (!_.isHex(req.body.storageId)) throw new Error('Incorrect storage id type.')
        }

        let payload = {
            sub: req.user.sub,
            _id: req.body.storageId,
        }

        if (req.body.projectId) {
            if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
            payload.projectId = req.body.projectId
        }

        return payload
    },
    request: async function(payload) {
        try {

            const storage = await IndexSchema.Storage.findOne(payload)
            if (!storage || !storage._id) throw new Error('Storage not found.')

            const storageValueStart = new Date()
            const storageValue = await S3.getObject({
                Bucket: process.env.STORAGE_BUCKET,
                Key: `${storage.sub}/storage/${storage._id}`,
            }).promise()

            const usages = [{
                sub: storage.sub,
                usageType: 'storage',
                usageDirection: 'down',
                usageAmount: Number(storageValue.ContentLength),
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: storage._id,
            }, {
                sub: storage.sub,
                usageType: 'storage',
                usageDirection: 'time',
                usageAmount: Number(new Date() - storageValueStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: storage._id,
            }]

            await Stats.updateStorageUsage({ storage, usages, }, IndexSchema)

            const directoryPath = `./files/downloads/${storage.filename}`
            const filePath = path.resolve(`${directoryPath}/${storage.originalname}`)

            await mkdirp(directoryPath)
            await writeFile(filePath, storageValue.Body)

            return filePath
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        return res.sendFile(request)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing storage id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect storage id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect project id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Storage not found.') return res.status(400).send('Storage not found.')
        else if (err.message === 'NoSuchKey: The specified key does not exist.') return res.status(400).send('No storage value.')
        else {
            console.log('Get file storage data error', err.message)
            return res.status(500).send('Request error')
        }
    },
}