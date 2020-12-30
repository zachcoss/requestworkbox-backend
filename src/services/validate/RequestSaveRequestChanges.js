const { update } = require('lodash');

const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    validUrl = require('valid-url'),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','authorization','authorizationType','query','headers','body','workflowId','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing request id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect request id type.')

        if (!_.includes(['GET','POST','get','post'], req.body.method)) throw new Error('Incorrect method type.')

        if (!_.isString(req.body.name)) throw new Error('Incorrect name type.')
        
        if (!req.body.url) throw new Error('Missing URL.')
        if (!/^https?:\/\//) throw new Error('Must be secure URL.')
        if (!validUrl.isWebUri(req.body.url)) throw new Error('Not valid URL.')
        if (_.includes(req.body.url, 'requestworkbox.com')) {
            if (!/.com\/$|.com$/.test(req.body.url)) throw new Error('Recursive URLs not allowed.')
        }

        let updates = _.pick(req.body, ['_id', 'url', 'name', 'method', 'authorization', 'query', 'headers', 'body'])
        updates.sub = req.user.sub

        if (_.isBoolean(req.body.lockedResource)) updates.lockedResource = req.body.lockedResource
        if (_.isBoolean(req.body.preventExecution)) updates.preventExecution = req.body.preventExecution
        if (_.isBoolean(req.body.sensitiveResponse)) updates.sensitiveResponse = req.body.sensitiveResponse

        if (req.body.authorization) {
            if (!_.isArray(req.body.authorization))
            if (_.size(req.body.authorization) !== 2)

            if (!_.isBoolean(req.body.authorization[0].active)) throw new Error('Incorrect authorization active type.')
            if (!_.isBoolean(req.body.authorization[0].active)) throw new Error('Incorrect authorization active type.')

            if (req.body.authorization[0].key !== 'username') throw new Error('Incorrect authorization key type.')
            if (req.body.authorization[1].key !== 'password') throw new Error('Incorrect authorization key type.')

            updates.authorization = req.body.authorization
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
            if (_.isBoolean(request.lockedResource) && request.lockedResource && !member.owner) throw new Error('Permission error.')
            
            // Requires write permissions
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            if (!member.owner) {
                delete updates.lockedResource
                delete updates.preventExecution
                delete updates.sensitiveResponse
            }
            
            return {request, updates}
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({request, updates}) {
        try {

            const requestOptions = _.pick(updates, ['url', 'name', 'method', 'authorization', 'query', 'headers', 'body'])

            _.each(requestOptions, (value, key) => {
                if (key === 'authorization') {
                    value = _.map(value, (authorizationObject) => {
                        return _.pick(authorizationObject, ['_id','active','key','value','valueType'])
                    })
                } else if (key === 'headers') {
                    value = _.map(value, (headerObj) => {
                        headerObj.key = headerObj.key.replace(/ /g,'-')
                        return _.pick(headerObj, ['_id','active','key','value','valueType'])
                    })
                }

                request[key] = value
            })
            
            if (_.size(request.authorization) !== 2) throw new Error('Authorization rate limit.')
            if (_.size(request.query) > 10) throw new Error('Query rate limit.')
            if (_.size(request.headers) > 10) throw new Error('Headers rate limit.')
            if (_.size(request.body) > 10) throw new Error('Body rate limit.')

            const lockingOptions = _.pick(updates, permissionKeys)

            _.each(lockingOptions, (value, key) => {
                request[key] = value
            })

            await request.save()

            return request.toJSON()
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Request: save request changes error.', err)
        return res.status(400).send(err.message)
    },
}