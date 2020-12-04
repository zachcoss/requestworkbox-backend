const 
    express = require('express'),
    router = express.Router(),
    upload = require('../../../services/tools/multer').upload,
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    Menu = require('../../../services/middleware/Menu'),
    Project = require('../../../services/middleware/Project'),
    Request = require('../../../services/middleware/Request'),
    Workflow = require('../../../services/middleware/Workflow'),
    Instance = require('../../../services/middleware/Instance'),
    Storage = require('../../../services/middleware/Storage'),
    Queue = require('../../../services/middleware/Queue'),
    Statuscheck = require('../../../services/middleware/Statuscheck'),
    Feedback = require('../../../services/middleware/Feedback'),
    Statistic = require('../../../services/middleware/Statistic');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.post('/get-project-name', Project.getProjectName)
    router.post('/update-project-name', Project.updateProjectName)
    router.post('/get-projects', Project.getProjects)
    router.post('/archive-project', Project.archiveProject)
    router.post('/restore-project', Project.restoreProject)

    router.post('/new-request', Menu.newRequest)
    router.post('/new-workflow', Menu.newWorkflow)
    router.post('/new-project', Menu.newProject)
    router.post('/new-storage', Menu.newStorage)
    router.post('/delete-entire-project', Menu.deleteEntireProject)

    router.post('/get-requests', Request.getRequests)
    router.post('/get-request', Request.getRequest)
    router.post('/get-request-details', Request.getRequestDetails)
    router.post('/save-request-changes', Request.saveRequestChanges)
    router.post('/add-request-detail-item', Request.addRequestDetailItem)
    router.post('/delete-request-detail-item', Request.deleteRequestDetailItem)
    router.post('/archive-request', Request.archiveRequest)
    router.post('/restore-request', Request.restoreRequest)
    router.post('/delete-request', Request.deleteRequest)

    router.post('/get-workflows', Workflow.getWorkflows)
    router.post('/get-workflow', Workflow.getWorkflow)
    router.post('/get-workflow-details', Workflow.getWorkflowDetails)
    router.post('/save-workflow-changes', Workflow.saveWorkflowChanges)
    router.post('/add-workflow-task', Workflow.addWorkflowTask)
    router.post('/delete-workflow-task', Workflow.deleteWorkflowTask)
    router.post('/archive-workflow', Workflow.archiveWorkflow)
    router.post('/restore-workflow', Workflow.restoreWorkflow)
    router.post('/delete-workflow', Workflow.deleteWorkflow)

    router.post('/return-workflow/:workflowId', Instance.startWorkflow)
    router.post('/queue-workflow/:workflowId', Instance.startWorkflow)
    router.post('/schedule-workflow/:workflowId', Instance.startWorkflow)

    router.post('/get-storages', Storage.getStorages)
    router.post('/get-storage', Storage.getStorage)
    router.post('/get-storage-details', Storage.getStorageDetails)
    router.post('/get-text-storage-data', Storage.getTextStorageData)
    router.post('/get-file-storage-data', Storage.getFileStorageData)
    router.post('/update-text-storage-data', Storage.updateTextStorageData)
    router.post('/update-file-storage-data', upload.single('file'), Storage.updateFileStorageData)
    router.post('/save-storage-changes', Storage.saveStorageChanges)
    router.post('/archive-storage', Storage.archiveStorage)
    router.post('/restore-storage', Storage.restoreStorage)
    router.post('/delete-storage', Storage.deleteStorage)
    router.post('/get-storage-usage', Storage.getStorageUsage)

    router.post('/get-instances', Statistic.getInstances)
    router.post('/get-instance', Statistic.getInstance)
    router.post('/get-instance-detail', Statistic.getInstanceDetail)
    router.post('/get-instance-usage', Statistic.getInstanceUsage)
    router.post('/delete-stats', Statistic.deleteStats)
    router.post('/download-instance-stat', Statistic.downloadInstanceStat)

    router.post('/get-schedule', Queue.getSchedule)
    router.post('/archive-all-queue', Queue.archiveAllQueue)
    router.post('/archive-queue', Queue.archiveQueue)

    router.post('/get-statuschecks', Statuscheck.getStatuschecks)

    router.post('/submit-feedback', Feedback.submitFeedback)

    return router;
}