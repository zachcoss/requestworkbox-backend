const
    _ = require('lodash'),
    moment = require('moment'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    getStatuschecks: async (req, res, next) => {
        if (!req.body.projectId) throw new Error('Missing project')

        try {
            const findPayload = { sub: req.user.sub, projectId: req.body.projectId }
            const statuschecks = await IndexSchema.Statuscheck.find(findPayload)

            return res.status(200).send(statuschecks)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getStatuscheck: async (req, res, next) => {
        try {
            if (!req.body.statuscheckId) throw new Error('Missing status check id')

            const findPayload = { sub: req.user.sub, _id: req.body.statuscheckId }
            const projection = '-__v'
            
            const statuscheck = await IndexSchema.Statuscheck.findOne(findPayload, projection)
            
            if (!statuscheck) throw new Error('Could not find status check')
            
            return res.status(200).send(statuscheck)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    saveStatuscheckChanges: async (req, res, next) => {
        try {
            if (!req.body._id) throw new Error('Missing status check id')

            const updates = _.pick(req.body, ['onWorkflowTaskError','sendWorkflowWebhook','interval'])

            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const statuscheck = await IndexSchema.Statuscheck.findOne(findPayload)

            _.each(updates, (value, key) => {
                statuscheck[key] = value
            })
            
            await statuscheck.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    startStatuscheck: async (req, res, next) => {
        try {
            if (!req.body.statuscheckId) throw new Error('Missing status check id')

            const findPayload = { sub: req.user.sub, _id: req.body.statuscheckId }
            const projection = '-__v'
            
            const statuscheck = await IndexSchema.Statuscheck.findOne(findPayload, projection)
            
            if (!statuscheck) throw new Error('Could not find status check')

            statuscheck.status = 'running'
            await statuscheck.save()
            
            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    stopStatuscheck: async (req, res, next) => {
        try {
            if (!req.body.statuscheckId) throw new Error('Missing status check id')

            const findPayload = { sub: req.user.sub, _id: req.body.statuscheckId }
            const projection = '-__v'
            
            const statuscheck = await IndexSchema.Statuscheck.findOne(findPayload, projection)
            
            if (!statuscheck) throw new Error('Could not find status check')

            statuscheck.status = 'stopped'
            await statuscheck.save()
            
            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}