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
            team: [],
        }

        _.each(req.body.team, (member) => {
            if (!_.isHex(member._id)) return
            if (!_.isBoolean(member.active)) return
            if (!_.isBoolean(member.owner)) return
            if (member.status === 'removed') return
            if (member.permission === 'none') return

            let update = { _id: member._id }

            if (_.isBoolean(member.includeSensitive)) {
                update.includeSensitive = member.includeSensitive
            }
            if (_.isBoolean(member.owner)) {
                update.owner = member.owner
            }
            if (_.includes(['read','write'], member.permission)) {
                update.permission = member.permission
            }

            payload.team.push(update)
        })

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
            
            return { project, payload }
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function({ project, payload }) {
        try {

            let updates = []

            for (teamMember of payload.team) {
                if (teamMember.owner) continue

                let member = await IndexSchema.Member.findOne({
                    _id: teamMember._id,
                    active: true,
                    owner: false,
                    projectId: project._id,
                    status: { $in: ['invited','accepted'] }
                })
                if (!member || !member._id) throw new Error('User not found.')

                if (_.isBoolean(teamMember.includeSensitive)) member.includeSensitive = teamMember.includeSensitive
                if (teamMember.permission) member.permission = teamMember.permission

                await member.save()
                updates.push(member.toJSON())
            }

            return updates
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
        console.log('Team: update team error.', err)
        return res.status(400).send(err.message)
    },
}