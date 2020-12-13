const 
    listStatuschecks = require('./StatuscheckListStatuschecks'),
    getStatuscheck = require('./StatuscheckGetStatuscheck'),
    saveStatuscheckChanges = require('./StatuscheckSaveStatuscheckChanges'),
    startStatuscheck = require('./StatuscheckStartStatuscheck'),
    stopStatuscheck = require('./StatuscheckStopStatuscheck');

module.exports = {
    listStatuschecks: listStatuschecks,
    getStatuscheck: getStatuscheck,
    saveStatuscheckChanges: saveStatuscheckChanges,
    startStatuscheck: startStatuscheck,
    stopStatuscheck: stopStatuscheck,
}