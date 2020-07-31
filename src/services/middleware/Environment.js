const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    getEnvironments: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v'
            const environments = await IndexSchema.Environment.find(findPayload, projection)
            return res.status(200).send(environments)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getEnvironmentDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.environmentId }
            const projection = '-__v'
            const environment = await IndexSchema.Environment.findOne(findPayload, projection)
            return res.status(200).send(environment)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    saveEnvironmentChanges: async (req, res, next) => {
        try {
            const updates = _.pick(req.body, ['name','data'])
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const environment = await IndexSchema.Environment.findOne(findPayload)
            _.each(updates, (value, key) => {
                environment[key] = value
            })
            await environment.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    addEnvironmentDetailItem: async (req, res, next) => {
        try {

            const environmentDetailOption = req.body.environmentDetailOption
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const environment = await IndexSchema.Environment.findOne(findPayload)
            const newItem = {
                _id: mongoose.Types.ObjectId(),
                key: '',
                value: '',
                active: true,
            }
            environment[environmentDetailOption].push(newItem)
            await environment.save()
            return res.status(200).send(newItem)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteEnvironmentDetailItem: async (req, res, next) => {
        try {
            const environmentDetailOption = req.body.environmentDetailOption
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const environment = await IndexSchema.Environment.findOne(findPayload)
            environment[environmentDetailOption].id(req.body.environmentDetailItemId).remove()
            await environment.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}