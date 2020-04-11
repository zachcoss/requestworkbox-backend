const express = require('express'),
    router = express.Router();

module.exports.createRoutes = function () {

    /**
     * * Index routes
     * **/

    router.get('/', require('./routes/index/index'))

    /**
     * * Connection API routes
     * **/

    router.get('/available-connections', require('./routes/connection/availableConnections').availableConnections)
    router.post('/create-connection', require('./routes/connection/createConnection').createConnection)
    router.get('/installed-connections', require('./routes/connection/installedConnections').installedConnections)
    router.post('/create-installation', require('./routes/connection/createInstallation').createInstallation)
    router.post('/authorize-installation', require('./routes/connection/authorizeInstallation').authorizeInstallation)

    /**
     * * Task API routes
     * TODO: create Task services
     * **/

    return router;
}