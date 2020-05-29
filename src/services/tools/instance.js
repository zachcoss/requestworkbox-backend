const
    _ = require('lodash'),
    moment = require('moment'),
    axios = require('axios'),
    indexSchema = require('../schema/indexSchema');

module.exports = {
    start: async (instanceId) => {

        console.log('instance start')

        const instance = await indexSchema['instance'].findById(instanceId)

        console.log(instance._id)

        const results = {}
        const state = {
            instance: instance._id,
            sub: instance.sub,
            workflow: instance.workflow._id,
            task: '',
            context: '',
            code: '',
            message: '',
        }

        function currentState() {
            return { state: state, results: results }
        }

        const runInstance = async () => {
            // Create workflow
            await new indexSchema['stat']({
                instance: state.instance,
                sub: state.sub,
                componentId: state.workflow,
                componentType: 'workflow',
                start: moment().toDate(),
            }).save()

            // Loop through tasks
            for (const task of instance.workflow.tasks) {
                // Create task
                state.task = task._id
                await new indexSchema['stat']({
                    instance: state.instance,
                    sub: state.sub,
                    componentId: task._id,
                    componentType: 'task',
                    start: moment().toDate(),
                }).save()

                if (task.globalContext) {
                    // Create global context
                    state.context = task.globalContext._id
                    await new indexSchema['stat']({
                        instance: state.instance,
                        sub: state.sub,
                        componentId: task.globalContext._id,
                        componentType: 'globalContext',
                        start: moment().toDate(),
                    }).save()

                    const result = await axios({
                        method: 'post',
                        url: task.globalContext.url,
                        data: currentState()
                    })

                    _.each(result.data, (value, key) => {
                        state[key] = value
                    })

                    const stat = await indexSchema['stat'].findOne({ instance: state.instance, componentId: task.globalContext._id })
                    stat.code = result.status
                    stat.message = result.statusText
                    stat.end = moment().toDate()
                    await stat.save()
                }

                if (task.authContext) {
                    // Create global context
                    state.context = task.authContext._id
                    await new indexSchema['stat']({
                        instance: state.instance,
                        sub: state.sub,
                        componentId: task.authContext._id,
                        componentType: 'authContext',
                        start: moment().toDate(),
                    }).save()

                    const result = await axios({
                        method: 'post',
                        url: task.authContext.url,
                        data: currentState()
                    })

                    _.each(result.data, (value, key) => {
                        state[key] = value
                    })

                    const stat = await indexSchema['stat'].findOne({ instance: state.instance, componentId: task.authContext._id })
                    stat.code = result.status
                    stat.message = result.statusText
                    stat.end = moment().toDate()
                    await stat.save()
                }

                if (task.requestContext) {
                    // Create global context
                    state.context = task.requestContext._id
                    await new indexSchema['stat']({
                        instance: state.instance,
                        sub: state.sub,
                        componentId: task.requestContext._id,
                        componentType: 'requestContext',
                        start: moment().toDate(),
                    }).save()

                    const result = await axios({
                        method: 'post',
                        url: task.requestContext.url,
                        data: currentState()
                    })

                    _.each(result.data, (value, key) => {
                        state[key] = value
                    })

                    const stat = await indexSchema['stat'].findOne({ instance: state.instance, componentId: task.requestContext._id })
                    stat.code = result.status
                    stat.message = result.statusText
                    stat.end = moment().toDate()
                    await stat.save()
                }

                // Perform Task Request

                const taskResult = await axios({
                    method: state.method || '',
                    url: state.url || '',
                })

                state.code = taskResult.status
                state.message = taskResult.statusText
                results[task._id] = taskResult.data

                if (task.responseContext) {
                    // Create global context
                    state.context = task.responseContext._id
                    await new indexSchema['stat']({
                        instance: state.instance,
                        sub: state.sub,
                        componentId: task.responseContext._id,
                        componentType: 'responseContext',
                        start: moment().toDate(),
                    }).save()

                    const result = await axios({
                        method: 'post',
                        url: task.responseContext.url,
                        data: currentState()
                    })

                    if (result.data && result.data.results && result.data.results[task._id]) results[task._id] = result.data.results[task._id]

                    const stat = await indexSchema['stat'].findOne({ instance: state.instance, componentId: task.responseContext._id })
                    stat.code = result.status
                    stat.message = result.statusText
                    stat.end = moment().toDate()
                    await stat.save()
                }

                const stat = await indexSchema['stat'].findOne({ instance: state.instance, componentId: task._id })
                stat.code = taskResult.status
                stat.message = taskResult.statusText
                stat.end = moment().toDate()
                await stat.save()

            }

            const stat = await indexSchema['stat'].findOne({ instance: state.instance, componentId: state.workflow })
            stat.code = 200
            stat.message = 'OK'
            stat.end = moment().toDate()
            await stat.save()

            console.log('instance complete')
        }


        try {
            console.log('running instance')
            const workflowLoop = await runInstance()
        } catch(err) {
            console.log('err', err)

            console.log(results)
            console.log(state)
        }

    },
}