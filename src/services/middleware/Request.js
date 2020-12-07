const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    validUrl = require('valid-url'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    getRequests: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId }
            const projection = '-__v'
            const requests = await IndexSchema.Request.find(findPayload, projection)
            return res.status(200).send(requests)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getRequest: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, project: req.body.projectId, _id: req.body.requestId, active: true }
            const projection = '-__v'
            
            const request = await IndexSchema.Request.findOne(findPayload, projection)
            
            if (!request) throw new Error('Could not find request')
            
            return res.status(200).send([request])
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    getRequestDetails: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.requestId }
            const projection = '-__v'
            const request = await IndexSchema.Request.findOne(findPayload, projection)
            return res.status(200).send(request)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    saveRequestChanges: async (req, res, next) => {
        try {
            const updates = _.pick(req.body, ['url', 'query', 'headers', 'body'])

            // validate url
            if (!validUrl.isWebUri(updates.url.url)) {
                console.log('Not valid URL', updates.url.url)
                return res.status(500).send('Not valid URL')
            }

            if (_.includes(updates.url.url, '/return-workflow') || 
                _.includes(updates.url.url, '/queue-workflow') || 
                _.includes(updates.url.url, '/schedule-workflow') || 
                _.includes(updates.url.url, '/statuscheck-workflow')) {
                    return res.status(500).send('Recursive URLs are not allowed')
            }

            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            _.each(updates, (value, key) => {
                request[key] = value
            })
            // fix headers
            _.each(request.headers, (headerObj) => {
                headerObj.key = headerObj.key.replace(/ /g,'-')
            })
            await request.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    addRequestDetailItem: async (req, res, next) => {
        try {

            const requestDetailOption = req.body.requestDetailOption
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            const newItem = {
                _id: mongoose.Types.ObjectId(),
                key: '',
                value: '',
                valueType: 'textInput',
            }
            request[requestDetailOption].push(newItem)
            await request.save()
            return res.status(200).send(newItem)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteRequestDetailItem: async (req, res, next) => {
        try {
            const requestDetailOption = req.body.requestDetailOption
            const findPayload = { sub: req.user.sub, _id: req.body._id }
            const request = await IndexSchema.Request.findOne(findPayload)
            request[requestDetailOption].id(req.body.requestDetailItemId).remove()
            await request.save()
            return res.status(200).send()
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    archiveRequest: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.requestId }
            const request = await IndexSchema.Request.findOne(findPayload)
            request.active = false
            await request.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    restoreRequest: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.requestId }
            const request = await IndexSchema.Request.findOne(findPayload)
            request.active = true
            await request.save()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    deleteRequest: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub, _id: req.body.requestId }
            const request = await IndexSchema.Request.findOne(findPayload)
            await request.remove()
            return res.status(200).send()
        } catch(err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}