const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','storageType','storageValue','mimetype','originalname','size','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing storage id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect storage id type.')

        let updates = _.pick(req.body, ['_id','sub'])

        if (req.body.name) {
            if (!_.isString(req.body.name)) throw new Error('Incorrect name type.')
            updates.name = req.body.name
        }

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

        return updates
    },
    authorize: async function(updates) {
        try {
            const 
                requesterSub = updates.sub,
                storageId = updates._id;
            
            const storage = await IndexSchema.Storage.findOne({ _id: storageId })
            if (!storage || !storage._id) throw new Error('Storage not found.')

            const project = await IndexSchema.Project.findOne({ _id: storage.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (storage.lockedResource && storage.lockedResource === true && !member.owner) throw new Error('Permission error.')
            
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            if (!member.owner) {
                delete updates.lockedResource
                delete updates.preventExecution
                delete updates.sensitiveResponse
            }
            
            return {storage, updates}
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function({storage, updates}) {
        try {

            if (updates.name) storage.name  = updates.name

            const lockingOptions = _.pick(updates, ['lockedResource','preventExecution','sensitiveResponse'])

            _.each(lockingOptions, (value, key) => {
                storage[key] = value
            })

            await storage.save()

            return storage.toJSON()
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