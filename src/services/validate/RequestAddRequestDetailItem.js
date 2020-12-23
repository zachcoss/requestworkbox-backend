const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    mongoose = require('mongoose'),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','query','headers','body','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing request id.')
        if (!req.body.requestDetailOption)  throw new Error('Missing request detail option.')

        if (!_.isHex(req.body._id)) throw new Error('Incorrect request id type.')
        if (!_.includes(['query','headers','body'], req.body.requestDetailOption)) {
            throw new Error('Incorrect request detail option type.')
        }

        const payload = {
            sub: req.user.sub,
            _id: req.body._id,
            requestDetailOption: req.body.requestDetailOption,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                requestId = payload._id;
            
            const request = await IndexSchema.Request.findOne({ _id: requestId })
            if (!request || !request._id) throw new Error('Request not found.')

            if (_.size(request[payload.requestDetailOption]) >= 10) throw new Error('Rate limit error.')

            const project = await IndexSchema.Project.findOne({ _id: request.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return { payload, request }
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function({ payload, request }) {
        try {

            request[payload.requestDetailOption].push({
                _id: mongoose.Types.ObjectId(),
                key: '',
                value: '',
                valueType: 'textInput',
            })
            await request.save()

            return request.toJSON()
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
        else if (err.message === 'Missing request id.') return res.status(400).send(err.message)
        else if (err.message === 'Missing request detail option.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect request id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect request detail option type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Request not found.') return res.status(400).send('Request not found.')
        else if (err.message === 'Error: Project not found.') return res.status(400).send('Project not found.')
        else {
            console.log('Add request detail item error', err)
            return res.status(500).send('Request error')
        }
    },
}