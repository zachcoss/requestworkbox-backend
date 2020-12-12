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
    Statuscheck = require('../../../services/middleware/Statuscheck'),
    Webhook = require('../../../services/middleware/Webhook'),
    Feedback = require('../../../services/middleware/Feedback'),
    Statistic = require('../../../services/middleware/Statistic');

module.exports.config = function () {

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

    router.post('/return-workflow/:workflowId', Instance.startWorkflow)
    router.post('/queue-workflow/:workflowId', Instance.startWorkflow)
    router.post('/schedule-workflow/:workflowId', Instance.startWorkflow)
    router.post('/statuscheck-workflow/:workflowId', Instance.startWorkflow)

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

    router.post('/get-instances', Statistic.getInstances)
    router.post('/get-instance', Statistic.getInstance)
    router.post('/get-instance-detail', Statistic.getInstanceDetail)
    router.post('/get-instance-usage', Statistic.getInstanceUsage)
    router.post('/download-instance-stat', Statistic.downloadInstanceStat)

    router.post('/get-schedule', Queue.getSchedule)
    router.post('/archive-all-queue', Queue.archiveAllQueue)
    router.post('/archive-queue', Queue.archiveQueue)

    router.post('/get-statuschecks', Statuscheck.getStatuschecks)
    router.post('/get-statuscheck', Statuscheck.getStatuscheck)
    router.post('/save-statuscheck-changes', Statuscheck.saveStatuscheckChanges)
    router.post('/start-statuscheck', Statuscheck.startStatuscheck)
    router.post('/stop-statuscheck', Statuscheck.stopStatuscheck)

    router.post('/new-webhook', Webhook.newWebhook)
    router.post('/get-webhooks', Webhook.getWebhooks)
    router.post('/get-webhook', Webhook.getWebhook)
    router.post('/save-webhook-changes', Webhook.saveWebhookChanges)
    router.post('/get-webhook-details', Webhook.getWebhookDetails)
    router.post('/webhooks/:webhookId', Webhook.acceptWebhook)
    router.post('/download-webhook-detail', Webhook.downloadWebhookDetail)

    router.post('/submit-feedback', Feedback.submitFeedback)

    return router;
}