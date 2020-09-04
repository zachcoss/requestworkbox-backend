const
    _ = require('lodash'),
    moment = require('moment'),
    Axios = require('axios'),
    indexSchema = require('../schema/indexSchema'),
    async = require('async'),
    asyncEachOf = async.eachSeries,
    Agent = require('agentkeepalive'),
    keepAliveAgent = new Agent({
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: 60000, // active socket keepalive for 60 seconds
        freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
    }),
    axios = Axios.create({httpAgent: keepAliveAgent}),
    socketService = require('./socket'),
    AWS = require('aws-sdk'),
    S3 = new AWS.S3();

module.exports = {
    start: async (instanceId) => {

        const snapshot = {}
        const state = {
            instance: {},
            workflow: {},
            requests: {},
            environments: {}
        }

        const getFunctions = {
            getInstance: async function() {
                const instance = await indexSchema.Instance.findById(instanceId)
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

        const templateFunctions = {
            templateInputs: function(requestId, inputs = {}) {
                const request = state.requests[requestId]
                const details = _.pick(request, ['query','headers','body'])

                const requestTemplate = {
                    url: {
                        method: '',
                        url: '',
                        name: ''
                    },
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
            },
        }

        const statFunctions = {
            createStat: async function(statConfig) {
                try {
                    // save stat
                    const stat = indexSchema.Stat(statConfig)
                    await stat.save()
                    // save stat to instance
                    state.instance.stats.push(stat._id)
                    await state.instance.save()
                    console.log('uploading to s3')
                    // save full stat to s3
                    await S3.upload({
                        Bucket: "connector-storage",
                        Key: `${state.instance.sub}/instance-statistics/${state.instance._id}/${stat._id}`,
                        Body: JSON.stringify(statConfig)
                    }).promise()
                    // console.log(s3upload)
                    console.log('done uploading')
                    console.log('emitting to socket')
                    // emit to socket
                    socketService.io.emit(state.instance.sub, statConfig);
                } catch(err) {
                    console.log('stat error', err)
                    throw new Error('Error creating stat')
                }
            }
        }

        const runFunctions = {
            runRequest: async function(requestTemplate, requestType) {
                const requestConfig = {
                    url: requestTemplate.url.url,
                    method: requestTemplate.url.method,
                    headers: requestTemplate.headers,
                    params: requestTemplate.query,
                    data: requestTemplate.body,
                }
                const statConfig = {
                    instance: instanceId,
                    requestName: requestTemplate.url.name,
                    requestType: requestType,
                    requestPayload: requestConfig,
                    responsePayload: {},
                    status: 0,
                    statusText: '',
                    startTime: new Date(),
                    endTime: new Date(),
                }
                try {
                    console.log('starting request')
                    const request = await axios(requestConfig)
                    console.log('request complete')
                    const requestResults = _.pick(request, ['data', 'status', 'statusText','headers'])
                    
                    statConfig.responsePayload = requestResults.data
                    statConfig.status = requestResults.status
                    statConfig.statusText = requestResults.statusText
                    statConfig.headers = requestResults.headers
                    statConfig.endTime = new Date()

                    await statFunctions.createStat(statConfig)

                    return requestResults
                } catch(err) {
                    console.log('request error', err)
                    throw new Error(err)
                }
            },
        }

        const processFunctions = {
            processRequestAdapterResponse: async function(requestAdapterResponse, taskId) {
                console.log('request adapter response', requestAdapterResponse)
                // if body contains
                // url, method, headers, params, data, update that template
                const requestToChange = snapshot[taskId].request
                console.log('request to change', requestToChange)
                const updates = _.pick(requestAdapterResponse.data, ['url', 'query','headers','body'])
                console.log('updates to make ', updates)

                // make updates
                _.each(updates, (value, key) => {
                    snapshot[taskId].request[key] = value
                })

            },
            processRequestResponse: async function(requestResponse, taskId) {
                console.log('request response', requestResponse)
                snapshot[taskId].response = requestResponse.data
            },
            processResponseAdapterResponse: async function(responseAdapterResponse, taskId) {
                console.log('response adapter response', responseAdapterResponse)
                snapshot[taskId].response = responseAdapterResponse.data
            },
        }

        const initFunctions = {
            initializeRequest: async function(taskId, requestId, inputs) {
                // apply inputs
                const requestTemplate = await templateFunctions.templateInputs(requestId, inputs)
                // initialize snapshot
                snapshot[taskId] = {
                    request: requestTemplate,
                    response: {},
                    allRequestAdapters: [],
                    allResponseAdapters: []
                }
            },
            initializeRequestAdapter: async function(taskId, requestId, inputs) {
                // apply inputs
                const requestTemplate = await templateFunctions.templateInputs(requestId, inputs)
                // store template
                snapshot[taskId].allRequestAdapters.push(requestTemplate)
            },
            initializeResponseAdapter: async function(taskId, requestId, inputs) {
                // apply inputs
                const requestTemplate = await templateFunctions.templateInputs(requestId, inputs)
                snapshot[taskId].allResponseAdapters.push(requestTemplate)
            },
        }

        const startFunctions = {
            startRequest: async function(taskId) {
                const requestTemplate = snapshot[taskId].request
                // perform request
                const requestResponse = await runFunctions.runRequest(requestTemplate, 'request')
                // perform updates
                processFunctions.processRequestResponse(requestResponse, taskId)
            },
            
            startRequestAdapter: async function(taskId) {
                const requestAdapterTemplateIndex = _.size(snapshot[taskId].allRequestAdapters) - 1
                // apply inputs
                const requestAdapterTemplate = snapshot[taskId].allRequestAdapters[requestAdapterTemplateIndex]
                // perform request
                const requestAdapterResponse = await runFunctions.runRequest(requestAdapterTemplate, 'requestAdapter')
                // perform updates
                processFunctions.processRequestAdapterResponse(requestAdapterResponse, taskId)
            },

            startResponseAdapter: async function(taskId) {
                const responseAdapterTemplateIndex = _.size(snapshot[taskId].allResponseAdapters) - 1
                // apply inputs
                const responseAdapterTemplate = snapshot[taskId].allResponseAdapters[responseAdapterTemplateIndex]
                // perform request
                const responseAdapterResponse = await runFunctions.runRequest(responseAdapterTemplate, 'responseAdapter')
                // perform updates
                processFunctions.processResponseAdapterResponse(responseAdapterResponse, taskId)
            },

            startWorkflow: async function() {
                for (const task of state.workflow.tasks) {

                    const request = state.requests[task.requestId]
                    await initFunctions.initializeRequest(task._id, task.requestId, task.inputs)
    
                    for (const requestAdapter of request.requestAdapters) {
                        await initFunctions.initializeRequestAdapter(task._id, requestAdapter.adapterId, requestAdapter.inputs)
                        await startFunctions.startRequestAdapter(task._id)
                    }
    
                    await startFunctions.startRequest(task._id)

                    for (const responseAdapter of request.responseAdapters) {
                        await initFunctions.initializeResponseAdapter(task._id, responseAdapter.adapterId, responseAdapter.inputs)
                        await startFunctions.startResponseAdapter(task._id)
                    }
                }
            },
        }

        const init = async () => {
            // initialize state
            await getFunctions.getInstance() 
            await getFunctions.getWorkflow()
            await getFunctions.getRequests()
            await getFunctions.getAdapters()
            await getFunctions.getWorkflowEnvironment()
            await getFunctions.getRequestEnvironments()

            // start workflow
            await startFunctions.startWorkflow()
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