const 
    _ = require('lodash')
    .mixin({
        isHex: function(string) {
            return /^[a-f0-9]{24}$/.test(string)
        }
    }),
    IndexSchema = require('../tools/schema').schema,
    keys = ['_id','active','name','projectId','tasks','payloads','webhooks','createdAt','updatedAt'],
    taskKeys = ['_id','requestId','runtimeResultName'],
    permissionKeys = ['lockedResource'];
    

module.exports = {
    validate: function(req, res) {

        if (!req.user || !req.user.sub) throw new Error('Invalid or missing token.')
        if (!req.body._id) throw new Error('Missing workflow id.')
        if (!_.isHex(req.body._id)) throw new Error('Incorrect workflow id type.')

        let updates = {
            sub: req.user.sub,
            _id: req.body._id,
        }

        if (req.body.name && !_.isString(req.body.name)) throw new Error('Incorrect name type.')
        if (req.body.tasks && !_.isArray(req.body.tasks)) throw new Error('Incorrect tasks type.')
        if (req.body.webhooks && !_.isArray(req.body.webhooks)) throw new Error('Incorrect webhooks type.')

        if (req.body.name) {
            updates.name = req.body.name
        }

        if (req.body.tasks && _.size(req.body.tasks) > 0 && _.size(req.body.tasks) <= 10) {
            let 
                error = false,
                dupError = false;
            
            let runtimeResultNames = {}
            _.each(req.body.tasks, (task) => {
                if (!_.isPlainObject(task)) return error = true
                if (!task._id || !_.isString(task._id) || !_.isHex(task._id)) return error = true
                if (task.requestId && !_.isHex(task.requestId)) return error = true
                if (task.runtimeResultName && !_.isString(task.runtimeResultName))  return error = true
                if (_.size(task.runtimeResultName) > 100) return error = true

                if (task.runtimeResultName === '') return
                
                if (!runtimeResultNames[task.runtimeResultName]) {
                    runtimeResultNames[task.runtimeResultName] = true
                } else {
                    return dupError = true
                }

            })
            if (error) throw new Error('Incorrect task object type.')
            if (dupError) throw new Error('Duplicate runtime result names not allowed.')

            updates.tasks = _.map(req.body.tasks, (task) => {
                return _.pickBy(task, function(value, key) {
                    return _.includes(taskKeys, key)
                })

            })
        }

        if (req.body.webhooks && _.size(req.body.webhooks) === 1) {
            let error = false
            _.each(req.body.webhooks, (webhook) => {
                if (!_.isPlainObject(webhook)) return error = true
                if (!webhook._id || !_.isString(webhook._id) || !_.isHex(webhook._id)) return error = true
                if (webhook.requestId && !_.isHex(webhook.requestId)) return error = true
            })
            if (error) throw new Error('Incorrect webhook object type.')
            updates.webhooks = _.map(req.body.webhooks, (webhook) => {
                return _.pickBy(webhook, function(value, key) {
                    return _.includes(taskKeys, key)
                })
            })
        }

        return updates
    },
    authorize: async function(updates) {
        try {
            const 
                requesterSub = updates.sub,
                workflowId = updates._id;
            
            const workflow = await IndexSchema.Workflow.findOne({ _id: workflowId })
            if (!workflow || !workflow._id) throw new Error('Workflow not found.')

            const project = await IndexSchema.Project.findOne({ _id: workflow.projectId }).lean()
            if (!project || !project._id) throw new Error('Project not found.')

            const member = await IndexSchema.Member.findOne({
                sub: requesterSub,
                projectId: project._id,
            }).lean()
            if (workflow.lockedResource && workflow.lockedResource === true && !member.owner) throw new Error('Permission error.')
            
            if (!member || !member._id) throw new Error('Permission error.')
            if (!member.active) throw new Error('Permission error.')
            if (member.status !== 'accepted') throw new Error('Permission error.')
            if (member.permission !== 'write') throw new Error('Permission error.')
            
            return {workflow, updates}
        } catch(err) {
            throw new Error(err)
        }
    },
    request: async function({workflow, updates}) {
        try {

            const updateData = _.omit(updates, ['_id', 'sub'])

            if (updates.name) workflow.name = updates.name

            if (workflow.tasks && updateData.tasks) {
                // if the same size
                // confirm all ids and update objects/order
                if (_.size(workflow.tasks) === _.size(updateData.tasks)) {
                    let taskIds = _.map(workflow.tasks, (obj) => String(obj._id))
                    const updateIds = _.map(updateData.tasks, '_id')

                    _.each(updateIds, (updateId) => {
                        _.pull(taskIds, updateId)
                    })

                    if (_.size(taskIds)) throw new Error('Incorrect tasks array.')

                    workflow.tasks = updateData.tasks

                // if not the same size
                // update matching objects only
                } else {
                    workflow.tasks = _.map(workflow.tasks, (task) => {
                        const matchingTask = _.filter(updateData.tasks, (update) => {
                            if (update._id === task._id) return true
                            else return false
                        })
                        if (!_.size(matchingTask)) return task
                        else {
                            task.requestId = matchingTask[0].requestId
                            return task
                        }
                    })
                }
            }

            if (workflow.webhooks && updateData.webhooks) {
                workflow.webhooks = updateData.webhooks
            }

            await workflow.save()
            return workflow.toJSON()
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
        else if (err.message === 'Missing workflow id.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect workflow id type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect name type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect tasks type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect webhooks type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect task object type.') return res.status(400).send(err.message)
        else if (err.message === 'Incorrect webhook object type.') return res.status(400).send(err.message)
        else if (err.message === 'Duplicate runtime result names not allowed.') return res.status(400).send(err.message)
        else if (err.message === 'Error: Workflow not found.') return res.status(400).send('Workflow not found.')
        else if (err.message === 'Error: Incorrect tasks array.') return res.status(400).send('Incorrect tasks array.')
        else {
            console.log('Save workflow changes error', err)
            return res.status(500).send('Request error')
        }
    },
}