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
        if (!req.body.projectId) throw new Error('Missing project id.')
        if (!req.body.username) throw new Error('Missing username.')
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')
        if (!/^[a-zA-Z0-9_]*$/.test(req.body.username)) throw new Error('Incorrect username type.')

        let payload = {
            sub: req.user.sub,
            projectId: req.body.projectId,
            username: req.body.username,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            const 
                requesterSub = payload.sub;

            const project = await IndexSchema.Project.findOne({ _id: payload.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            // Member
            const member = await IndexSchema.Member.findOne({
                username: payload.username,
                projectId: project._id,
            })
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status !== 'invited' && 
                member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'none' && 
                member.permission !== 'read' && 
                member.permission !== 'write') throw new Error('Permission error.')

            // Requester
            const requester = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (!requester || !requester._id) throw new Error('Permission error.')
            if (!requester.active) throw new Error('Permission error.')
            if (requester.status === 'removed') throw new Error('Permission error.')
            if (requester.status !== 'invited' && 
                requester.status !== 'accepted') throw new Error('Permission error.')
            if (requester.permission !== 'none' && 
                requester.permission !== 'read' && 
                requester.permission !== 'write') throw new Error('Permission error.')
            
            if (!requester.owner) {
                if (String(requester._id) !== String(member._id)) throw new Error('Permission error.')
            }

            const archivedMembers = await IndexSchema.Member.countDocuments({
                active: false,
                projectId: project._id,
            })

            if (archivedMembers >= 10) throw new Error('Rate limit error.')
            
            return member
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(member) {
        try {

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
        console.log('Team: remove invite error.', err)
        return res.status(400).send(`Team: remove invite error. ${err.message}`)
    },
}