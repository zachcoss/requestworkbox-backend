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
        if (!req.body.storageId) throw new Error('Missing storage id.')
        if (!_.isHex(req.body.storageId)) throw new Error('Incorrect storage id type.')

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
            // Requires write permissions
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            if (storage.sensitiveResponse && storage.sensitiveResponse === true && member.permission !== 'write') throw new Error('Permission error.')
            
            return storage
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(storage) {
        try {

            const storageValueStart = new Date()
            const storageValue = await S3.getObject({
                Bucket: process.env.STORAGE_BUCKET,
                Key: `${storage.projectId}/storage-data/${storage._id}`,
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
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.sendFile(request)
    },
    error: function(err, res) {
        console.log('Storage: get file storage data error.', err.message)
        return res.status(400).send(`Storage: get file storage data error. ${err.message}`)
    },
}