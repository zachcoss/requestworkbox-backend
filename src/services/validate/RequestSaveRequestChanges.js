const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    validUrl = require('valid-url'),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','url','name','method','active','projectId','query','headers','body','permissions','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse','healthcheckEndpoint'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing request id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect request id type.')

        if (!_.includes(['GET','POST','get','post'], req.body.method)) throw new Error('Incorrect method type.')

        if (!_.isString(req.body.name)) throw new Error('Incorrect name type.')
        
        if (!req.body.url) throw new Error('Missing URL.')
        if (!validUrl.isWebUri(req.body.url)) throw new Error('Not valid URL.')
        if (_.includes(req.body.url, '/return-workflow') || 
            _.includes(req.body.url, '/queue-workflow') || 
            _.includes(req.body.url, '/schedule-workflow') || 
            _.includes(req.body.url, '/statuscheck-workflow')) {
                throw new Error('Recursive URLs not allowed.')
        }

        let updates = _.pick(req.body, ['_id', 'url', 'name', 'method', 'query', 'headers', 'body'])
        updates.sub = req.user.sub
        return updates
    },
    request: async function(payload) {
        try {

            const request = await IndexSchema.Request.findOne({
                sub: payload.sub,
                _id: payload._id,
            })

            if (!request || !request._id) throw new Error('Request not found.')

            const updates = _.omit(payload, ['_id', 'sub'])

            _.each(updates, (value, key) => {
                request[key] = value
            })

            // fix headers
            _.each(request.headers, (headerObj) => {
                headerObj.key = headerObj.key.replace(/ /g,'-')
            })

            await request.save()

            return request
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