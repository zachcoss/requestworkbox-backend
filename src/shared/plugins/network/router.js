const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    RequestMenu = require('../../../services/middleware/RequestMenu'),
    RequestProject = require('../../../services/middleware/RequestProject'),
    RequestTable = require('../../../services/middleware/RequestTable');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.post('/get-project-name', RequestProject.getProjectName)
    router.post('/update-project-name', RequestProject.updateProjectName)

    router.post('/new-request', RequestMenu.newRequest)
    router.post('/new-workflow', RequestMenu.newWorkflow)
    router.post('/new-project', RequestMenu.newProject)
    // router.post('/add-to-workflow', RequestMenu.addToWorkflow)
    router.post('/test-request', RequestMenu.testRequest)

    router.post('/get-requests', RequestTable.getRequests)
    router.post('/get-request-details', RequestTable.getRequestDetails)
    router.post('/save-changes', RequestTable.saveChanges)
    router.post('/add-request-detail-item', RequestTable.addRequestDetailItem)
    router.post('/delete-request-detail-item', RequestTable.deleteRequestDetailItem)
    router.post('/add-adapter', RequestTable.addAdapter)
    router.post('/delete-adapter', RequestTable.deleteAdapter)

    return router;
}