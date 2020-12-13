const 
    listQueues = require('./QueueListQueues'),
    archiveAllQueues = require('./QueueArchiveAllQueues'),
    archiveQueue = require('./QueueArchiveQueue');

module.exports = {
    listQueues: listQueues,
    archiveAllQueues: archiveAllQueues,
    archiveQueue: archiveQueue,
}