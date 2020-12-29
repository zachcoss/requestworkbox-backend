const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    Cognito = require('../tools/cognito').Cognito,
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

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            // Requires owner permission
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (!member.owner) throw new Error('Permission error.')
            if (member.status === 'removed') throw new Error('Permission error.')
            if (member.status === 'invited') throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission === 'none') throw new Error('Permission error.')
            if (member.permission === 'read') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')

            if (payload.username === member.username) throw new Error('Permission error.')

            const activeMembers = await IndexSchema.Member.countDocuments({
                active: true,
                projectId: project._id,
            })

            if (activeMembers >= 10) throw new Error('Rate limit error.')
            
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            let usernameVerified = false

            const listUsers = await Cognito.listUsers({
                UserPoolId: process.env.API_AWS_USER_POOL,
                AttributesToGet: [ 'sub', ],
            }).promise()

            const userFound = _.filter(listUsers.Users, (user) => {
                if (user.Username === payload.username) {
                    usernameVerified = true
                    return true
                }
            })

            if (!userFound || !_.size(userFound)) return 'OK'
            if (!usernameVerified) return 'OK'

            const user = userFound[0]
            let userSub;

            _.each(user.Attributes, (attribute) => {
                if (attribute.Name === 'sub') {
                    userSub = attribute.Value
                }
            })

            if (!userSub) return 'OK'

            const member = await IndexSchema.Member.findOne({
                sub: userSub,
                projectId: payload.projectId,
            })

            if (member && member._id) {
                member.active = true
                member.owner = false
                member.includeSensitive = false
                member.status = 'invited'
                member.permission = 'read'

                await member.save()
            } else {
                const member = IndexSchema.Member({
                    sub: userSub,
                    projectId: payload.projectId,
                    username: payload.username,
                })
    
                await member.save()
            }

            return 'OK'
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        return res.status(200).send(request)
    },
    error: function(err, res) {
        console.log('Team: create invite error.', err)
        return res.status(400).send(err.message)
    },
}