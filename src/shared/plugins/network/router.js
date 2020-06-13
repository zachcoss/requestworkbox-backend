const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    indexMiddlewareBeta = require('../../../services/middleware/indexMiddleware-beta'),
    RequestMenu = require('../../../services/middleware/RequestMenu'),
    RequestProject = require('../../../services/middleware/RequestProject');

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

    return router;
}