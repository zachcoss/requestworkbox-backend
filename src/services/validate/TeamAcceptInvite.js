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
        if (!_.isHex(req.body.projectId)) throw new Error('Incorrect project id type.')

        let payload = {
            sub: req.user.sub,
            projectId: req.body.projectId,
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
            })
            // Requires invitation
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'accepted') throw new Error('Permission error.')
            if (member.status !== 'invited') throw new Error('Permission error.')
            if (member.permission !== 'none' &&  
                member.permission !== 'read' &&  
                member.permission !== 'write') throw new Error('Permission error.')
            
            return {project, member}
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({project, member}) {
        try {

            member.owner = false
            member.active = true
            member.status = 'accepted'
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
        console.log('Team: accept invite error.', err)
        return res.status(400).send(`Team: accept invite error. ${err.message}`)
    },
}