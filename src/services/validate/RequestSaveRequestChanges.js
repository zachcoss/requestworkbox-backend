const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    validUrl = require('valid-url'),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','query','headers','body','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing request id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect request id type.')

        if (!_.includes(['GET','POST','get','post'], req.body.method)) throw new Error('Incorrect method type.')

        if (!_.isString(req.body.name)) throw new Error('Incorrect name type.')
        
        if (!req.body.url) throw new Error('Missing URL.')
        if (!validUrl.isWebUri(req.body.url)) throw new Error('Not valid URL.')
        if (_.includes(req.body.url, '/return-request') || 
            _.includes(req.body.url, '/return-workflow') || 
            _.includes(req.body.url, '/queue-request') || 
            _.includes(req.body.url, '/queue-workflow') || 
            _.includes(req.body.url, '/schedule-request') || 
            _.includes(req.body.url, '/schedule-workflow')) {
                throw new Error('Recursive URLs not allowed.')
        }
        if (_.includes(req.body.url, 'requestworkbox.com')) {
            if (req.path !== '/') throw new Error('Recursive URLs not allowed.')
        }

        let updates = _.pick(req.body, ['_id', 'url', 'name', 'method', 'query', 'headers', 'body'])
        updates.sub = req.user.sub

        if (req.body.lockedResource && !_.isBoolean(req.body.lockedResource))
        if (req.body.preventExecution && !_.isBoolean(req.body.preventExecution)) throw new Error('Incorrect locked resource type.')
        if (req.body.sensitiveResponse && !_.isBoolean(req.body.sensitiveResponse)) throw new Error('Incorrect locked resource type.')

        if (req.body.lockedResource) {
            if (!_.isBoolean(req.body.lockedResource)) throw new Error('Incorrect locked resource type.')
            updates.lockedResource = req.body.lockedResource
        }

        if (req.body.preventExecution) {
            if (!_.isBoolean(req.body.preventExecution)) throw new Error('Incorrect prevent execution type.')
            updates.preventExecution = req.body.preventExecution
        }

        if (req.body.sensitiveResponse) {
            if (!_.isBoolean(req.body.sensitiveResponse)) throw new Error('Incorrect sensitive response type.')
            updates.sensitiveResponse = req.body.sensitiveResponse
        }

        if (req.body.authorizationType === 'header') {
            if (!req.body.authorization) throw new Error()
            // x-api-key
            if (!req.body.authorization.key) throw new Error()
            // DSF@-SDF@@DCSD-@#$DAEAFD-ASDFSF
            if (!req.body.authorization.value) throw new Error()
            // textInput
            if (!req.body.authorization.valueType) throw new Error()
        }

        if (req.body.authorizationType === 'basicAuth') {
            if (!req.body.authorization) throw new Error()
            // username
            if (!req.body.authorization.key) throw new Error()
            // DSF@-SDF@@DCSD-@#$DAEAFD-ASDFSF
            if (!req.body.authorization.value) throw new Error()
            // textInput
            if (!req.body.authorization.valueType) throw new Error()
            
            // password
            if (!req.body.authorization.key) throw new Error()
            // DSF@-SDF@@DCSD-@#$DAEAFD-ASDFSF
            if (!req.body.authorization.value) throw new Error()
            // textInput
            if (!req.body.authorization.valueType) throw new Error()
        }


        return updates
    },
    authorize: async function(updates) {
        try {
            const 
                requesterSub = updates.sub,
                requestId = updates._id;
            
            const request = await IndexSchema.Request.findOne({ _id: requestId })
            if (!request || !request._id) throw new Error('Request not found.')

            const project = await IndexSchema.Project.findOne({ _id: request.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (request.lockedResource && request.lockedResource === true && !member.owner) throw new Error('Permission error.')
            
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            if (!member.owner) {
                delete updates.lockedResource
                delete updates.preventExecution
                delete updates.sensitiveResponse
            }
            
            return {request, updates}
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function({request, updates}) {
        try {

            const requestOptions = _.pick(updates, ['url', 'name', 'method', 'query', 'headers', 'body'])

            _.each(requestOptions, (value, key) => {
                request[key] = value
            })
            _.each(request.headers, (headerObj) => {
                headerObj.key = headerObj.key.replace(/ /g,'-')
            })

            const lockingOptions = _.pick(updates, ['lockedResource','preventExecution','sensitiveResponse'])

            _.each(lockingOptions, (value, key) => {
                request[key] = value
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
        else if (err.message === 'Incorrect method type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect name type.') return res.status(400).send(err.message)
        else if (err.message === 'Missing URL.') return res.status(400).send(err.message)
        else if (err.message === 'Not valid URL.') return res.status(400).send(err.message)
        else if (err.message === 'Recursive URLs not allowed.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Request not found.') return res.status(400).send('Request not found.')
        else {
            console.log('Save request changes error', err)
            return res.status(500).send('Request error')
        }
    },
}