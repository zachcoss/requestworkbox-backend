const 
    express = require('express'),
    router = express.Router(),
    upload = require('../../../services/tools/multer').upload,
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    Project = require('../../../services/middleware/Project'),
    Request = require('../../../services/middleware/Request'),
    Workflow = require('../../../services/middleware/Workflow'),
    Instance = require('../../../services/middleware/Instance'),
    Storage = require('../../../services/middleware/Storage'),
    Queue = require('../../../services/middleware/Queue'),
    Feedback = require('../../../services/middleware/Feedback'),
    Team = require('../../../services/middleware/Team');

module.exports.config = function () {

    router.all('*', indexMiddleware.ratelimit)
    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.post('/create-project', Project.createProject)
    router.post('/list-projects', Project.listProjects)
    router.post('/get-project', Project.getProject)
    router.post('/update-project', Project.updateProject)
    router.post('/archive-project', Project.archiveProject)
    router.post('/restore-project', Project.restoreProject)

    router.post('/create-request', Request.createRequest)
    router.post('/list-requests', Request.listRequests)
    router.post('/get-request', Request.getRequest)
    router.post('/save-request-changes', Request.saveRequestChanges)
    router.post('/add-request-detail-item', Request.addRequestDetailItem)
    router.post('/delete-request-detail-item', Request.deleteRequestDetailItem)
    router.post('/archive-request', Request.archiveRequest)
    router.post('/restore-request', Request.restoreRequest)

    router.post('/create-workflow', Workflow.createWorkflow)
    router.post('/list-workflows', Workflow.listWorkflows)
    router.post('/get-workflow', Workflow.getWorkflow)
    router.post('/save-workflow-changes', Workflow.saveWorkflowChanges)
    router.post('/add-workflow-task', Workflow.addWorkflowTask)
    router.post('/delete-workflow-task', Workflow.deleteWorkflowTask)
    router.post('/archive-workflow', Workflow.archiveWorkflow)
    router.post('/restore-workflow', Workflow.restoreWorkflow)
    router.post('/return-workflow/:workflowId', Workflow.startWorkflow)
    router.post('/queue-workflow/:workflowId', Workflow.startWorkflow)
    router.post('/schedule-workflow/:workflowId', Workflow.startWorkflow)

    router.post('/create-storage', Storage.createStorage)
    router.post('/list-storages', Storage.listStorages)
    router.post('/get-storage', Storage.getStorage)
    router.post('/get-text-storage-data', Storage.getTextStorageData)
    router.post('/get-file-storage-data', Storage.getFileStorageData)
    router.post('/update-text-storage-data', Storage.updateTextStorageData)
    router.post('/update-file-storage-data', upload.single('file'), Storage.updateFileStorageData)
    router.post('/save-storage-changes', Storage.saveStorageChanges)
    router.post('/archive-storage', Storage.archiveStorage)
    router.post('/restore-storage', Storage.restoreStorage)
    router.post('/get-storage-usage', Storage.getStorageUsage)

    router.post('/list-instances', Instance.listInstances)
    router.post('/get-instance', Instance.getInstance)
    router.post('/get-instance-detail', Instance.getInstanceDetail)
    router.post('/get-instance-usage', Instance.getInstanceUsage)
    router.post('/download-instance-stat', Instance.downloadInstanceStat)

    router.post('/list-queues', Queue.listQueues)
    router.post('/archive-all-queues', Queue.archiveAllQueues)
    router.post('/archive-queue', Queue.archiveQueue)

    router.post('/submit-feedback', Feedback.submitFeedback)

    router.post('/create-invite', Team.createInvite)
    router.post('/accept-invite', Team.acceptInvite)
    router.post('/remove-from-team', Team.removeFromTeam)

    return router;
}