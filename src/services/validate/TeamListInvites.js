const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','status','projectId','projectName','projectUsername','owner','username','permission','includeSensitive'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')

        let payload = {
            sub: req.user.sub,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub;

            let memberships = await IndexSchema.Member.find({
                sub: requesterSub,
                active: true,
                owner: false,
                status: { $in: ['accepted','invited'] },
            }).lean()

            return memberships
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(memberships) {
        try {

            const projects = await IndexSchema.Project.find({
                _id: {$in: _.map(memberships, 'projectId')}
            }).lean()

            const owners = await IndexSchema.Member.find({
                projectId: {$in: _.map(projects, '_id')},
                active: true,
                owner: true,
                status: 'accepted',
                permission: 'write',
            }).lean()

            _.each(memberships, (membership) => {
                const matchingProject = _.filter(projects, (project) => {
                    if (String(project._id) === String(membership.projectId)) return true
                    else return false
                })

                const matchingOwner = _.filter(owners, (owner) => {
                    if (String(owner.projectId) === String(membership.projectId)) return true
                    else return false
                })

                membership.projectName = matchingProject[0].name
                membership.projectUsername = matchingOwner[0].username
            })

            return memberships
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            let responseData = _.pickBy(request, function(value, key) {
                return _.includes(keys, key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Team: list invites error.', err)
        return res.status(400).send(err.message)
    },
}