const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','storageType','storageValue','mimetype','originalname','size','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.storageId) throw new Error('Missing storage id.')
        if (!_.isHex(req.body.storageId)) throw new Error('Incorrect storage id type.')

        const payload = {
            sub: req.user.sub,
            _id: req.body.storageId,
        }

        return payload
    },
    request: async function(payload) {
        try {

            const storage = await IndexSchema.Storage.findOne(payload)

            if (!storage || !storage._id) throw new Error('Storage not found.')

            storage.active = false
            await storage.save()

            return storage
        } catch(err) {
            throw new Error(err)
        }
    },
    response: function(request, res) {
        const response = _.pickBy(request, function(value, key) {
            return _.includes(keys, key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Missing storage id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect storage id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Storage not found.') return res.status(400).send('Storage not found.')
        else {
            console.log('Archive storage error', err)
            return res.status(500).send('Request error')
        }
    },
}