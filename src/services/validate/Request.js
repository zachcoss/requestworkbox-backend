const 
    createRequest = require('./RequestCreateRequest'),
    listRequests = require('./RequestListRequests'),
    getRequest = require('./RequestGetRequest'),
    saveRequestChanges = require('./RequestSaveRequestChanges'),
    addRequestDetailItem = require('./RequestAddRequestDetailItem'),
    deleteRequestDetailItem = require('./RequestDeleteRequestDetailItem'),
    archiveRequest = require('./RequestArchiveRequest'),
    restoreRequest = require('./RequestRestoreRequest');

module.exports = {
    createRequest: createRequest,
    listRequests: listRequests,
    getRequest: getRequest,
    saveRequestChanges: saveRequestChanges,
    addRequestDetailItem: addRequestDetailItem,
    deleteRequestDetailItem: deleteRequestDetailItem,
    archiveRequest: archiveRequest,
    restoreRequest: restoreRequest,
}