const
    socketService = require('./socket'),
    IndexSchema = require('./schema').schema;

    module.exports = {
        updateQueueStats: async function(payload) {
            const { queue, status, statusText, error } = payload

            // Create Queue Stat
            const queueStat = new IndexSchema.QueueStat({
                active: true,
                sub: queue.sub,
                instance: queue.instance,
                queue: queue._id,
                status: status,
                statusText: statusText || '',
                error: error || false,
            })
            await queueStat.save()

            // Add to Queue
            queue.stats.push(queueStat)
            // Update status
            queue.status = status
            // Save queue
            await queue.save()

            socketService.io.emit(queue.sub, { queueDoc: queue, })
        },
    }