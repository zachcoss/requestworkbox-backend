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

        let updates = {
            _id: req.body._id,
            sub: req.user.sub,
        }

        if (req.body.name) {
            if (!_.isString(req.body.name)) throw new Error('Incorrect name type.')
            updates.name = req.body.name
        }

        if (_.isBoolean(req.body.lockedResource)) updates.lockedResource = req.body.lockedResource
        if (_.isBoolean(req.body.preventExecution)) updates.preventExecution = req.body.preventExecution
        if (_.isBoolean(req.body.sensitiveResponse)) updates.sensitiveResponse = req.body.sensitiveResponse

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
            
            return {storage, updates}
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({storage, updates}) {
        try {

            if (updates.name) storage.name  = updates.name

            const lockingOptions = _.pick(updates, permissionKeys)

            _.each(lockingOptions, (value, key) => {
                storage[key] = value
            })

            await storage.save()

            return storage.toJSON()
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
        console.log('Storage: save storage changes error.', err)
        return res.status(400).send(err.message)
    },
}