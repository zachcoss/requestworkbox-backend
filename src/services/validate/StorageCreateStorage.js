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
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!req.body.storageType) throw new Error('Missing storage type.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
        if (!_.includes(['text','file'], req.body.storageType)) {
            throw new Error('Incorrect storage type.')
        }

        const payload = {
            sub: req.user.sub,
            _id: req.body.projectId,
            storageType: req.body.storageType,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub,
                projectId = payload._id;

            const project = await IndexSchema.Project.findOne({ _id: projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            const activeStorages = await IndexSchema.Storage.countDocuments({
                active: true,
                projectId: project._id,
            })

            if (activeStorages >= 10) throw new Error('Rate limit error.')
            
            return {payload, project, requesterSub}
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({payload, project, requesterSub}) {
        try {

            const storage = new IndexSchema.Storage({
                sub: requesterSub,
                projectId: project._id,
                storageType: payload.storageType,
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
        console.log('Storage: create storage error.', err)
        return res.status(400).send(`Storage: create storage error. ${err.message}`)
    },
}