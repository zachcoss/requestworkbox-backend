const
    AvailableConnectionModel = require('../../schema/connection').availableConnectionModel;

module.exports.availableConnections = async function (req, res, next) {
    try {
        const queryObject = await module.exports.createQueryObject()
        const availableConnections = await module.exports.queryAvailableConnections(queryObject)

        res.status(200).send(availableConnections)
    } catch (err) {
        res.status(500).send('error returning available connections')
    }
}

module.exports.createQueryObject = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const queryObject = {
                active: true
            }
            return resolve(queryObject)
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports.queryAvailableConnections = function (queryObject) {
    return new Promise(async (resolve, reject) => {
        try {
            const availableConnections = await AvailableConnectionModel.find(queryObject).exec()
            return resolve(availableConnections)
        } catch (err) {
            return reject(err)
        }
    })
}