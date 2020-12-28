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
            return payload
        } catch(err) {
            throw new Error(err.message)
        }
    },
    request: async function(payload) {
        try {

            let setting = await IndexSchema.Setting.findOne(payload)
            if (!setting || !setting._id) throw new Error('Settings not found.')

            const activeProjects = await IndexSchema.Project.countDocuments({
                sub: setting.sub,
                active: true,
            })

            if (activeProjects >= 10) throw new Error('Rate limit error.')

            // Create project
            let project = new IndexSchema.Project(payload)
            // Create member
            let member = new IndexSchema.Member({
                sub: setting.sub,
                owner: true,
                username: setting.username,
                
                status: 'accepted',
                permission: 'write',
                includeSensitive: true,

                projectId: project._id,
            })

            await project.save()
            await member.save()
            
            return project.toJSON()
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
        console.log('Project: create project error.', err)
        return res.status(400).send(`Project: create project error. ${err.message}`)
    },
}