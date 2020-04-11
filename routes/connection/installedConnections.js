const
    InstalledConnectionModel = require('../../schema/connection').installedConnectionModel;

module.exports.installedConnections = async function (req, res, next) {
    try {
        const pipeline = await module.exports.createAggregationPipeline()
        const installedConnections = await module.exports.queryInstalledConnections(pipeline)
        
        res.status(200).send(installedConnections)
    } catch (err) {
        res.status(500).send('error returning installed connections')
    }
}

module.exports.createAggregationPipeline = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const pipeline = [
                {
                    $match: {
                        active: true
                    }
                },
                {
                    $lookup: {
                        from: 'availableconnections',
                        localField: 'connectionId',
                        foreignField: '_id',
                        as: 'connection'
                    }
                },
                { $unwind: '$connection' }
            ]
            return resolve(pipeline)
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports.queryInstalledConnections = function (pipeline) {
    return new Promise(async (resolve, reject) => {
        try {
            const installedConnections = await InstalledConnectionModel.aggregate(pipeline).exec()
            return resolve(installedConnections)
        } catch (err) {
            return reject(err)
        }
    })
}