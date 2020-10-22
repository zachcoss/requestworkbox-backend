const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    readFile = util.promisify(fs.readFile),
    writeFile = util.promisify(fs.writeFile),
    mkdirp = require('mkdirp'),
    IndexSchema = require('@requestworkbox/internal-tools').schema,
    S3 = require('@requestworkbox/internal-tools').S3;

module.exports = {
    getStorages: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v'
            const storages = await IndexSchema.Storage.find(findPayload, projection)
            return res.status(200).send(storages)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getStorageDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload)

            return res.status(200).send(storage)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getTextStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload, '_id').lean()

            const storageValue = await S3.getObject({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
            }).promise()

            const fullStorageValue = String(storageValue.Body)
            storage.storageValue = fullStorageValue

            const usage = new IndexSchema.Usage({
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'down',
                usageAmount: Number(storageValue.ContentLength),
                usageLocation: 'api'
            })
            await usage.save()

            return res.status(200).send(storage)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getFileStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload, '_id').lean()

            const storageValue = await S3.getObject({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
            }).promise()

            const directoryPath = `./files/downloads/${storage.filename}`
            const filePath = path.resolve(`${directoryPath}/${storage.originalname}`)

            await mkdirp(directoryPath)
            await writeFile(filePath, storageValue.Body)

            const usage = new IndexSchema.Usage({
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'down',
                usageAmount: Number(storageValue.ContentLength),
                usageLocation: 'api'
            })
            await usage.save()

            return res.sendFile(filePath)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateTextStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.query.storageid }
            const storage = await IndexSchema.Storage.findOne(findPayload, '_id')

            if (!storage) throw new Error('Storage not found.')

            const textData = Buffer.from(req.body.storageValue, 'utf8')

            await S3.upload({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
                Body: textData
            }).promise()

            storage['size'] = Number(textData.byteLength)
            await storage.save()

            const usage = new IndexSchema.Usage({
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'up',
                usageAmount: Number(textData.byteLength),
                usageLocation: 'api'
            })
            await usage.save()

            return res.status(200).send(storage)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateFileStorageData: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.query.storageid }
            const storage = await IndexSchema.Storage.findOne(findPayload, '_id')

            if (!storage) throw new Error('Storage not found.')

            const file = await readFile(req.file.path, 'utf8')

            await S3.upload({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
                Body: file
            }).promise()

            _.each(req.file, (value, key) => {
                storage[key] = value
            })
            await storage.save()

            const usage = new IndexSchema.Usage({
                sub: req.user.sub,
                usageType: 'storage',
                usageDirection: 'up',
                usageAmount: Number(req.file.size),
                usageLocation: 'api'
            })
            await usage.save()

            return res.status(200).send(storage)
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
}