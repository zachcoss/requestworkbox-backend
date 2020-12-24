const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!req.body.memberId) throw new Error('Missing member id.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
        if (!_.isHex(req.body.memberId)) throw new Error('Incorrect member id type.')

        let payload = {
            sub: req.user.sub,
            projectId: req.body.projectId,
            memberId: req.body.memberId,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub;

            const project = await IndexSchema.Project.findOne({ _id: payload.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.owner) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            if (member._id === payload.memberId) throw new Error('Cannot remove owner from team.')

            const archivedMembers = await IndexSchema.Member.countDocuments({
                active: false,
                projectId: project._id,
            })

            if (archivedMembers >= 10) throw new Error('Rate limit error.')
            
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            const member = await IndexSchema.Member.findOne({
                sub: payload.sub,
                projectId: payload.projectId,
                _id: payload.memberId,
            })

            member.owner = false
            member.active = false
            member.status = 'removed'
            member.permission = 'none'
            member.includeSensitive = false

            await member.save()

            return 'OK'
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        console.log('Team: remove from team error.', err)
        return res.status(400).send(`Team: remove from team error. ${err.message}`)
    },
}