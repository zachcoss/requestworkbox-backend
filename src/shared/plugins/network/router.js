const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    Menu = require('../../../services/middleware/Menu'),
    Project = require('../../../services/middleware/Project'),
    Request = require('../../../services/middleware/Request'),
    Workflow = require('../../../services/middleware/Workflow'),
    Storage = require('../../../services/middleware/Storage'),
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
    router.post('/new-storage', Menu.newStorage)

    router.post('/get-requests', Request.getRequests)
    router.post('/get-request-details', Request.getRequestDetails)
    router.post('/save-request-changes', Request.saveRequestChanges)
    router.post('/add-request-detail-item', Request.addRequestDetailItem)
    router.post('/delete-request-detail-item', Request.deleteRequestDetailItem)
    router.post('/archive-request', Request.archiveRequest)
    router.post('/restore-request', Request.restoreRequest)
    router.post('/delete-request', Request.deleteRequest)

    router.post('/get-workflows', Workflow.getWorkflows)
    router.post('/get-workflow-details', Workflow.getWorkflowDetails)
    router.post('/save-workflow-changes', Workflow.saveWorkflowChanges)
    router.post('/add-workflow-task', Workflow.addWorkflowTask)
    router.post('/delete-workflow-task', Workflow.deleteWorkflowTask)
    router.post('/start-workflow/:workflowId', Workflow.startWorkflow)
    router.post('/return-workflow/:workflowId', Workflow.returnWorkflow)
    router.post('/archive-workflow', Workflow.archiveWorkflow)
    router.post('/restore-workflow', Workflow.restoreWorkflow)
    router.post('/delete-workflow', Workflow.deleteWorkflow)

    router.post('/get-storages', Storage.getStorages)
    router.post('/get-storage-detail', Storage.getStorageDetail)
    router.post('/update-storage-detail', Storage.updateStorageDetail)
    router.post('/save-storage-changes', Storage.saveStorageChanges)
    router.post('/archive-storage', Storage.archiveStorage)
    router.post('/restore-storage', Storage.restoreStorage)
    router.post('/delete-storage', Storage.deleteStorage)

    router.post('/get-instances', Statistic.getInstances)
    router.post('/get-instance-detail', Statistic.getInstanceDetail)

    return router;
}