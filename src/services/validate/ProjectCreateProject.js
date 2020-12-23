const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','createdAt','updatedAt'],
    permissionKeys = ['returnWorkflow','queueWorkflow','scheduleWorkflow'];

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')

        const payload = {
            sub: req.user.sub,
        }

        return payload
    },
    authorize: async function(payload) {
        try {
            return payload
        } catch(err) {
            throw new Error(err)
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
            throw new Error(err)
        }
    },
    response: function(request, res) {
        let response = _.pickBy(request, function(value, key) {
            return _.includes(keys.concat(permissionKeys), key)
        })
        return res.status(200).send(response)
    },
    error: function(err, res) {
        if (err.message === 'Invalid or missing token.') return res.status(401).send(err.message)
        else if (err.message === 'Error: Settings not found.') return res.status(401).send('Invalid or missing token.')
        else if (err.message === 'Error: Project not found.') return res.status(400).send('Project not found.')
        else {
            console.log('Create project error', err)
            return res.status(500).send('Request error')
        }
    },
}