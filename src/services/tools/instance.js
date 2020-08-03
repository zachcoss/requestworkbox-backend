const
    _ = require('lodash'),
    moment = require('moment'),
    Axios = require('axios'),
    indexSchema = require('../schema/indexSchema'),
    async = require('async'),
    template = require('url-template'),
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

        const state = {
            instance: {},
            workflow: {},
            requests: {},
            environments: {}
        }

        async function getInstance() {
            const instance = await indexSchema.Instance.findById(instanceId, '', {lean: true})
            state.instance = instance
            // console.log('instance found', instance)
            return
        }

        async function getWorkflow() {
            const workflow = await indexSchema.Workflow.findById(state.instance.workflow, '', {lean: true})
            state.workflow = workflow
            // console.log('workflow found', workflow)
            return
        }

        async function getRequests() {
            await async.eachOfSeries(state.workflow.tasks, async function (task, index) {
                if (!task.requestId || task.requestId === '') return;
                if (state.requests[task.requestId]) return;
                const request = await indexSchema.Request.findById(task.requestId, '', {lean: true})
                state.requests[task.requestId] = request
            });
        }

        async function getAdapters() {
            await async.eachOfSeries(state.requests, async function (request, index) {
                await async.eachOfSeries(request.requestAdapters, async function(requestAdapter, index) {
                    if (!requestAdapter.adapterId || requestAdapter.adapterId === '') return;
                    if (state.requests[requestAdapter.adapterId]) return;
                    const adapter = await indexSchema.Request.findById(requestAdapter.adapterId, '', {lean: true})
                    state.requests[requestAdapter.adapterId] = adapter
                })
                await async.eachOfSeries(request.responseAdapters, async function(responseAdapter, index) {
                    if (!responseAdapter.adapterId || responseAdapter.adapterId === '') return;
                    if (state.requests[responseAdapter.adapterId]) return;
                    const adapter = await indexSchema.Request.findById(responseAdapter.adapterId, '', {lean: true})
                    state.requests[responseAdapter.adapterId] = adapter
                })
            });
        }

        async function getWorkflowEnvironment() {
            if (!state.workflow.environment || state.workflow.environment === '') return;
            if (state.environments[state.workflow.environment]) return;
            const environment = await indexSchema.Environment.findById(state.workflow.environment, '', {lean: true})
            state.environments[state.workflow.environment] = environment
        }

        async function getRequestEnvironments() {
            await async.eachOfSeries(state.requests, async function(request, index) {
                if (!request.environment || request.environment === '') return;
                if (state.environments[request.environment]) return;
                const environment = await indexSchema.Environment.findById(request.environment, '', {lean: true})
                state.environments[request.environment] = environment
            })
        }

        async function listRequestManifest() {
            await async.eachOfSeries(state.workflow.tasks, async function(task, index) {
                await async.eachOfSeries(state.requests[task.requestId].requestAdapters, async function(requestAdapter, index) {
                    const request = state.requests[requestAdapter.adapterId]
                    console.log(request.url.name)
                })
                console.log(state.requests[task.requestId].url.name)
                await async.eachOfSeries(state.requests[task.requestId].responseAdapters, async function(responseAdapter, index) {
                    const request = state.requests[responseAdapter.adapterId]
                    console.log(request.url.name)
                })
            })
        }

        const init = async () => {
            await getInstance() 
            await getWorkflow()
            await getRequests()
            await getAdapters()
            await getWorkflowEnvironment()
            await getRequestEnvironments()
            await listRequestManifest()
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