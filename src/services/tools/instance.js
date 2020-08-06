const
    _ = require('lodash'),
    moment = require('moment'),
    Axios = require('axios'),
    indexSchema = require('../schema/indexSchema'),
    async = require('async'),
    asyncEachOf = async.eachOf,
    Agent = require('agentkeepalive'),
    keepAliveAgent = new Agent({
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: 60000, // active socket keepalive for 60 seconds
        freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
    }),
    axios = Axios.create({httpAgent: keepAliveAgent});

module.exports = {
    start: async (instanceId) => {

        const snapshot = {}
        const state = {
            instance: {},
            workflow: {},
            requests: {},
            environments: {}
        }

        const stateFunctions = {
            getInstance: async function() {
                const instance = await indexSchema.Instance.findById(instanceId, '', {lean: true})
                state.instance = instance
                // console.log('instance found', instance)
                return
            },
            getWorkflow: async function() {
                const workflow = await indexSchema.Workflow.findById(state.instance.workflow, '', {lean: true})
                state.workflow = workflow
                // console.log('workflow found', workflow)
                return
            },
            getRequests: async function() {
                await asyncEachOf(state.workflow.tasks, async function (task, index) {
                    if (!task.requestId || task.requestId === '') return;
                    if (state.requests[task.requestId]) return;
                    const request = await indexSchema.Request.findById(task.requestId, '', {lean: true})
                    state.requests[task.requestId] = request
                });
            },
            getAdapters: async function() {
                await asyncEachOf(state.requests, async function (request, index) {
                    await asyncEachOf(request.requestAdapters, async function(requestAdapter, index) {
                        if (!requestAdapter.adapterId || requestAdapter.adapterId === '') return;
                        if (state.requests[requestAdapter.adapterId]) return;
                        const adapter = await indexSchema.Request.findById(requestAdapter.adapterId, '', {lean: true})
                        state.requests[requestAdapter.adapterId] = adapter
                    })
                    await asyncEachOf(request.responseAdapters, async function(responseAdapter, index) {
                        if (!responseAdapter.adapterId || responseAdapter.adapterId === '') return;
                        if (state.requests[responseAdapter.adapterId]) return;
                        const adapter = await indexSchema.Request.findById(responseAdapter.adapterId, '', {lean: true})
                        state.requests[responseAdapter.adapterId] = adapter
                    })
                });
            },
            getWorkflowEnvironment: async function() {
                if (!state.workflow.environment || state.workflow.environment === '') return;
                if (state.environments[state.workflow.environment]) return;
                const environment = await indexSchema.Environment.findById(state.workflow.environment, '', {lean: true})
                state.environments[state.workflow.environment] = environment
            },
            getRequestEnvironments: async function() {
                await asyncEachOf(state.requests, async function(request, index) {
                    if (!request.environment || request.environment === '') return;
                    if (state.environments[request.environment]) return;
                    const environment = await indexSchema.Environment.findById(request.environment, '', {lean: true})
                    state.environments[request.environment] = environment
                })
            }
        }

        const requestFunctions = {
            applyInputs: function(requestId, inputs = {}) {
                const request = state.requests[requestId]
                const details = _.pick(request, ['parameters','query','headers','body'])

                const requestTemplate = {
                    url: {
                        protocol: '',
                        method: '',
                        url: '',
                        name: ''
                    },
                    parameters: {},
                    query: {},
                    headers: {},
                    body: {}
                }

                // Apply url
                _.each(request.url, (value, key) => {
                    requestTemplate.url[key] = value
                })

                // Apply inputs
                _.each(details, (detailArray, detailKey) => {
                    _.each(detailArray, (detailObj, detailIndex) => {
                        if (detailObj.key === '') return;
                        
                        requestTemplate[detailKey][detailObj.key] = detailObj.value

                        if (detailObj.acceptInput && inputs[detailKey] && inputs[detailKey][detailObj.key]) {
                            requestTemplate[detailKey][detailObj.key] = inputs[detailKey][detailObj.key]
                        }
                    })
                })

                return requestTemplate
            }
        }

        const initFunctions = {
            initializeRequestAdapter: async function(taskId, requestId, inputs) {
                // apply inputs
                const requestTemplate = await requestFunctions.applyInputs(requestId, inputs)
                snapshot[taskId].allRequestAdapters.push(requestTemplate)
            },
            initializeResponseAdapter: async function(taskId, requestId, inputs) {
                // apply inputs
                const requestTemplate = await requestFunctions.applyInputs(requestId, inputs)
                snapshot[taskId].allResponseAdapters.push(requestTemplate)
            },
            startRequestAdapter: async function(taskId) {
                const adapterIndex = _.size(snapshot[taskId].allRequestAdapters) - 1
                const requestTemplate = snapshot[taskId].allRequestAdapters[adapterIndex]
            },
            startResponseAdapter: async function(taskId) {
                const adapterIndex = _.size(snapshot[taskId].allResponseAdapters) - 1
                const requestTemplate = snapshot[taskId].allResponseAdapters[adapterIndex]
            },
            initializeRequest: async function(taskId, requestId, inputs) {
                // apply inputs
                const requestTemplate = await requestFunctions.applyInputs(requestId, inputs)
                // initialize snapshot
                snapshot[taskId] = {
                    request: requestTemplate,
                    response: {},
                    allRequestAdapters: [],
                    allResponseAdapters: []
                }
            },
            start: async function() {
                await asyncEachOf(state.workflow.tasks, async function(task, taskIndex) {
                    const request = state.requests[task.requestId]
                    // initialize request
                    await initFunctions.initializeRequest(task._id, task.requestId, task.inputs)
                    // loop through request adapters
                    await asyncEachOf(request.requestAdapters, async function(requestAdapter, requestAdapterIndex) {
                        await initFunctions.initializeRequestAdapter(task._id, requestAdapter.adapterId, requestAdapter.inputs)
                    })
                    await asyncEachOf(request.responseAdapters, async function(responseAdapter, responseAdapterIndex) {
                        await initFunctions.initializeResponseAdapter(task._id, responseAdapter.adapterId, responseAdapter.inputs)
                    })
                })
            }
        }

        const init = async () => {
            // initialize state
            await stateFunctions.getInstance() 
            await stateFunctions.getWorkflow()
            await stateFunctions.getRequests()
            await stateFunctions.getAdapters()
            await stateFunctions.getWorkflowEnvironment()
            await stateFunctions.getRequestEnvironments()
            // begin
            await initFunctions.start()
            console.log(snapshot)
            return
        }

        try {
            console.log('instance start')
            await init()
        } catch(err) {
            console.log('err', err)
        }

    },
}