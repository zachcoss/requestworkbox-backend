const 
    createRequest = require('./RequestCreateRequest'),
    getRequests = require('./RequestGetRequests'),
    getRequest = require('./RequestGetRequest'),
    saveRequestChanges = require('./RequestSaveRequestChanges'),
    addRequestDetailItem = require('./RequestAddRequestDetailItem'),
    deleteRequestDetailItem = require('./RequestDeleteRequestDetailItem'),
    archiveRequest = require('./RequestArchiveRequest'),
    restoreRequest = require('./RequestRestoreRequest');

module.exports = {
    createRequest: createRequest,
    getRequests: getRequests,
    getRequest: getRequest,
    saveRequestChanges: saveRequestChanges,
    addRequestDetailItem: addRequestDetailItem,
    deleteRequestDetailItem: deleteRequestDetailItem,
    archiveRequest: archiveRequest,
    restoreRequest: restoreRequest,
}