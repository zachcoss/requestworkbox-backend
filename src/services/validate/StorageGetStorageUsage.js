const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    // includes usage
    keys = ['_id','active','name','projectId','storageType','storageValue','mimetype','originalname','size','usage','totalBytesDown','totalBytesUp','totalMs','createdAt','updatedAt'],
    usageKeys = ['_id','active','usageType','usageDirection','usageAmount','usageMeasurement','usageLocation','usageId','usageDetail','createdAt','updatedAt'],
    permissionKeys = ['lockedResource','preventExecution','sensitiveResponse'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')

        if (!req.body.storageId) throw new Error('Missing storage id.')
        if (!_.isHex(req.body.storageId)) throw new Error('Incorrect storage id type.')

        let payload = {
            sub: req.user.sub,
            _id: req.body.storageId,
        }

        if (req.body.projectId) {
            if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
            payload.projectId = req.body.projectId
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                storageId = payload._id;
            
            const storage = await IndexSchema.Storage.findOne({ _id: storageId })
            if (!storage || !storage._id) throw new Error('Storage not found.')

            if (payload.projectId && payload.projectId !== storage.projectId.toString()) throw new Error('Project not found.')

            const project = await IndexSchema.Project.findOne({ _id: storage.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            
            return storage.toJSON()
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(storage) {
        try {
            return storage
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })

        response.usage = _.map(response.usage, (usage) => {
            const responseData = _.pickBy(usage, function(value, key) {
                return _.includes(usageKeys, key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Storage: get storage usage error.', err)
        return res.status(400).send(`Storage: get storage usage error. ${err.message}`)
    },
}