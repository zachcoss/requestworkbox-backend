const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware');

module.exports.config = function () {

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)

    router.get('/developer/components*/all', indexMiddleware.all)
    router.post('/developer/components*/create', indexMiddleware.create)
    router.post('/developer/components*/edit', indexMiddleware.edit)

    router.post('/developer/instance/:workflow/start', indexMiddleware.startWorkflow)

    return router;
}