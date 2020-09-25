const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema'),
    AWS = require('aws-sdk'),
    S3 = new AWS.S3();

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
    getStorageDetail: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload, '_id').lean()

            const storageValue = await S3.getObject({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
            }).promise()

            const fullStorageValue = String(storageValue.Body)
            storage.storageValue = fullStorageValue

            return res.status(200).send(storage)
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
    updateStorageDetail: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.storageId }
            const storage = await IndexSchema.Storage.findOne(findPayload, '_id').lean()

            await S3.upload({
                Bucket: "connector-storage",
                Key: `${findPayload.sub}/storage/${findPayload._id}`,
                Body: req.body.storageValue
            }).promise()

            return res.status(200).send(storage)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
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