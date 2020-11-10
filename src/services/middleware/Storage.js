const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    readFile = util.promisify(fs.readFile),
    writeFile = util.promisify(fs.writeFile),
    mkdirp = require('mkdirp'),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3;

module.exports = {
    getStorages: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v -usage'
            const storages = await IndexSchema.Storage.find(findPayload, projection)
            return res.status(200).send(storages)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getStorage: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId, _id: req.body.storageId, active: true }
            const projection = '-__v -usage'
            
            const storage = await IndexSchema.Storage.findOne(findPayload, projection)
            
            if (!storage) throw new Error('Could not find storage')
            
            return res.status(200).send([storage])
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getStorageDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const projection = '-__v -usage'
            const storage = await IndexSchema.Storage.findOne(findPayload, projection)

            return res.status(200).send(storage)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getTextStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload)

            const storageValueStart = new Date()
            const storageValue = await S3.getObject({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
            }).promise()

            const usages = [{
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'down',
                usageAmount: Number(storageValue.ContentLength),
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: storage._id,
            }, {
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'time',
                usageAmount: Number(new Date() - storageValueStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: storage._id,
            }]

            await Stats.updateStorageUsage({ storage, usages, }, IndexSchema)

            const fullStorageValue = String(storageValue.Body)
            storage.storageValue = fullStorageValue

            delete storage.usage

            return res.status(200).send(storage)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getFileStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload)

            const storageValueStart = new Date()
            const storageValue = await S3.getObject({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
            }).promise()

            const usages = [{
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'down',
                usageAmount: Number(storageValue.ContentLength),
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: storage._id,
            }, {
                sub: req.user.sub,
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

            return res.sendFile(filePath)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateTextStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.query.storageid }
            const storage = await IndexSchema.Storage.findOne(findPayload)

            if (!storage) throw new Error('Storage not found.')

            const textDataStart = new Date()
            const textData = Buffer.from(req.body.storageValue, 'utf8')

            await S3.upload({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
                Body: textData
            }).promise()

            const textDataSize = Number(textData.byteLength)
            storage['size'] = textDataSize

            const usages = [{
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'up',
                usageAmount: textDataSize,
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: storage._id,
            }, {
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'time',
                usageAmount: Number(new Date() - textDataStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: storage._id,
            }]

            await Stats.updateStorageUsage({ storage, usages, }, IndexSchema)

            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateFileStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.query.storageid }
            const storage = await IndexSchema.Storage.findOne(findPayload)

            if (!storage) throw new Error('Storage not found.')

            const fileDataStart = new Date()
            const file = await readFile(req.file.path, 'utf8')

            await S3.upload({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
                Body: file
            }).promise()

            _.each(req.file, (value, key) => {
                storage[key] = value
            })
            const fileDataSize = Number(req.file.size)
            storage['size'] = fileDataSize

            const usages = [{
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'up',
                usageAmount: fileDataSize,
                usageMeasurement: 'byte',
                usageLocation: 'api',
                usageId: storage._id,
            }, {
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'time',
                usageAmount: Number(new Date() - fileDataStart),
                usageMeasurement: 'ms',
                usageLocation: 'api',
                usageId: storage._id,
            }]

            await Stats.updateStorageUsage({ storage, usages, }, IndexSchema)

            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send('Please confirm file is a JSON or Text file')
        }
    },
    saveStorageChanges: async (req, res, next) => {
        try {
            const updates = _.pick(req.body, ['name'])
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const storage = await IndexSchema.Storage.findOne(findPayload)
            _.each(updates, (value, key) => {
                storage[key] = value
            })
            await storage.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    archiveStorage: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload)
            storage.active = false
            await storage.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    restoreStorage: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload)
            storage.active = true
            await storage.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteStorage: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload)
            await storage.remove()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getStorageUsage: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload, 'usage')

            return res.status(200).send(storage)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}