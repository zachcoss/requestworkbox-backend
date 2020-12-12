const 
    listInstances = require('./InstanceListInstances'),
    getInstance = require('./InstanceGetInstance'),
    getInstanceDetail = require('./InstanceGetInstanceDetail'),
    getInstanceUsage = require('./InstanceGetInstanceUsage'),
    downloadInstanceStat = require('./InstanceDownloadInstanceStat');

module.exports = {
    listInstances: listInstances,
    getInstance: getInstance,
    getInstanceDetail: getInstanceDetail,
    getInstanceUsage: getInstanceUsage,
    downloadInstanceStat: downloadInstanceStat,
}