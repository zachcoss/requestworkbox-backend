const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    Menu = require('../../../services/middleware/Menu'),
    Project = require('../../../services/middleware/Project'),
    Request = require('../../../services/middleware/Request'),
    Workflow = require('../../../services/middleware/Workflow'),
    Environment = require('../../../services/middleware/Environment'),
    Statistic = require('../../../services/middleware/Statistic');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.post('/get-project-name', Project.getProjectName)
    router.post('/update-project-name', Project.updateProjectName)
    router.post('/get-projects', Project.getProjects)

    router.post('/new-request', Menu.newRequest)
    router.post('/new-workflow', Menu.newWorkflow)
    router.post('/new-project', Menu.newProject)
    router.post('/new-environment', Menu.newEnvironment)
    // router.post('/add-to-workflow', Menu.addToWorkflow)
    router.post('/test-request', Menu.testRequest)

    router.post('/get-requests', Request.getRequests)
    router.post('/get-request-details', Request.getRequestDetails)
    router.post('/save-request-changes', Request.saveRequestChanges)
    router.post('/add-request-detail-item', Request.addRequestDetailItem)
    router.post('/delete-request-detail-item', Request.deleteRequestDetailItem)
    router.post('/add-request-adapter', Request.addRequestAdapter)
    router.post('/delete-request-adapter', Request.deleteRequestAdapter)

    router.post('/get-workflows', Workflow.getWorkflows)
    router.post('/get-workflow-details', Workflow.getWorkflowDetails)
    router.post('/save-workflow-changes', Workflow.saveWorkflowChanges)
    router.post('/add-workflow-task', Workflow.addWorkflowTask)
    router.post('/delete-workflow-task', Workflow.deleteWorkflowTask)
    router.post('/start-workflow/:workflowId', Workflow.startWorkflow)

    router.post('/get-environments', Environment.getEnvironments)
    router.post('/get-environment-details', Environment.getEnvironmentDetails)
    router.post('/save-environment-changes', Environment.saveEnvironmentChanges)
    router.post('/add-environment-detail-item', Environment.addEnvironmentDetailItem)
    router.post('/delete-environment-detail-item', Environment.deleteEnvironmentDetailItem)

    router.post('/get-instances', Statistic.getInstances)
    router.post('/get-statistics', Statistic.getStatistics)

    return router;
}