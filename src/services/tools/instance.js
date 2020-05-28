module.exports = {
    start: async (instance) => {
        const stats = {}

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

        function createStatObject(componentId, isTask, context) {
            stats[componentId] = {
                instance: state.instance,
                sub: state.sub,
                component: componentId,
                start: new Date(),
            }
        }

        function updateStatObject(componentId, code, message) {
            stats[componentId].code = code
            stats[componentId].message = message
            stats[componentId].end = new Date()
        }

        function currentState() {
            return { state: state, results: results }
        }
        
        function parseContextResults(data) {
            return _.omit(data, ['instance', 'sub', 'workflow', 'task', 'context', 'code', 'message'])
        }

        function parseResponseContextResults(data, taskId) {
            return _.pick(data, [`results.${taskId}`])
        }

        const runInstance = async () => {
            // Create workflow
            createStatObject(internalState.workflow)

            // Loop through tasks

            for (const task of instance.workflow.tasks) {
                // Create task
                state.task = task._id
                createStatObject(task._id)

                if (task.globalContext) {
                    // Create global context
                    state.context = task.globalContext._id
                    createStatObject(task.globalContext._id)

                    const result = await axios.post(task.globalContext.url).body(currentState())
                    const resultData = parseContextResults(result.data) 

                    _.each(resultData, (value, key) => {
                        state[key] = value
                    })

                    updateStatObject(task.globalContext._id, result.statusCode, result.statusMessage)
                }

                if (task.authContext) {
                    // Create global context
                    state.context = task.authContext._id
                    createStatObject(task.authContext._id)

                    const result = await axios.post(task.authContext.url).body(currentState())
                    const resultData = parseContextResults(result.data)

                    _.each(resultData, (value, key) => {
                        state[key] = value
                    })

                    updateStatObject(task.authContext._id, result.statusCode, result.statusMessage)
                }

                if (task.requestContext) {
                    // Create global context
                    state.context = task.requestContext._id
                    createStatObject(task.requestContext._id)

                    const result = await axios.post(task.requestContext.url).body(currentState())
                    const resultData = parseContextResults(result.data)

                    _.each(resultData, (value, key) => {
                        state[key] = value
                    })

                    updateStatObject(task.requestContext._id, result.statusCode, result.statusMessage)
                }

                // Perform Task Request

                const taskResult = await axios.options(_.pick(state, 'headers', 'url'))

                state.code = taskResult.statusCode
                state.message = taskResult.statusMessage
                results[task._id] = taskResult

                if (task.responseContext) {
                    state.context = task.responseContext._id
                    createStatObject(task.responseContext._id)

                    const result = await axios.post(task.responseContext.url).body(currentState())
                    const resultData = parseResponseContextResults(result.data, task._id)
                    results[task._id] = resultData

                    updateStatObject(task.responseContext._id, result.statusCode, result.statusMessage)
                }

                updateStatObject(task._id, state.statusCode, state.statusMessage)

            }

            updateStatObject(internalState.workflow, state.statusCode, state.statusMessage)

        }

        const uploadStats = async () => {
            for (const stat of stats) {
                const doc = new StatSchema(stat)
                await doc.save()
            }
        }

        try {
            const workflowLoop = await runInstance()
            const statLoop = await uploadStats()
            console.log('all set')
        } catch(err) {
            console.log('err', err)
        }

    },
}