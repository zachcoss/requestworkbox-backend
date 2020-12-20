const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','permissions','projectId','storageType','storageValue','mimetype','originalname','size','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','sensitiveData'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing storage id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect storage id type.')

        let updates = _.pick(req.body, ['_id','name'])

        updates.sub = req.user.sub
        return updates
    },
    request: async function(payload) {
        try {

            const storage = await IndexSchema.Storage.findOne({
                sub: payload.sub,
                _id: payload._id,
            })

            if (!storage || !storage._id) throw new Error('Storage not found.')

            const updates = _.omit(payload, ['_id', 'sub'])

            _.each(updates, (value, key) => {
                storage[key] = value
            })

            await storage.save()

            return storage
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
        else if (err.message === 'Missing storage id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect storage id type.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Storage not found.') return res.status(400).send('Storage not found.')
        else {
            console.log('Save storage changes error', err)
            return res.status(500).send('Request error')
        }
    },
}