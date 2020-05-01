const 
    express = require('express'),
    router = express.Router(),
    indexMiddleware = require('../../../services/middleware/indexMiddleware'),
    apiMiddleware = require('../../../services/middleware/apiMiddleware'),
    apiMiddlewareBeta = require('../../../services/middleware/apiMiddleware-beta');

module.exports.config = function () {

    /**
     * * Index routes
     * **/

    router.get('/', indexMiddleware.healthcheck)
    router.all('*', indexMiddleware.interceptor)


    /**
     * * API routes
     * **/

    router.get('/available-api', apiMiddleware.availableAPI)
    router.get('/installed-api', apiMiddleware.installedAPI)

    router.post('/create', apiMiddleware.create)
    router.post('/install', apiMiddleware.install)
    router.post('/authorize', apiMiddleware.authorize)

    router.get('/developer/components*/all', apiMiddlewareBeta.all)
    router.post('/developer/components*/create', apiMiddlewareBeta.create)
    router.post('/developer/components*/edit', apiMiddlewareBeta.edit)
    
 
    /**
     * * Task routes
     * TODO: create Task services
     * **/

    return router;
}