const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','owner','projectType','globalWorkflowStatus','workflowCount','workflowLast','usage','usageRemaining','usageTotal','createdAt','updatedAt'],
    permissionKeys = ['returnRequest','returnWorkflow','queueRequest','queueWorkflow','scheduleRequest','scheduleWorkflow'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')

        const payload = { sub: req.user.sub, }

        return payload
    },
    authorize: async function(payload) {
        try {
            const requesterSub = payload.sub;
            const members = await IndexSchema.Member.find({
                active: true,
                sub: requesterSub,
                status: 'accepted' ,
            }).lean()

            const projectIds = _.map(members, 'projectId')

            let projects = await IndexSchema.Project.find({
                _id: { $in: projectIds }
            }).lean()

            _.each(projects, (project) => {
                const owner = _.filter(members, (member) => {
                    if (String(member.projectId) === String(project._id) && member.owner) return true
                    else return false
                })
                project.owner  = (owner && _.size(owner)) ? true : false
            })

            return projects
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(projects) {
        try {
            return projects
        } catch(err) {
            throw new Error(err.message)
        }
    },
    response: function(request, res) {
        const response = _.map(request, (request) => {
            let responseData = _.pickBy(request, function(value, key) {
                return _.includes(keys.concat(permissionKeys), key)
            })
            return responseData
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        console.log('Project: list projects error.', err)
        return res.status(400).send(err.message)
    },
}