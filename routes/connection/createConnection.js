const
    AvailableConnectionModel = require('../../schema/connection').availableConnectionModel;

module.exports.createConnection = async function (req, res, next) {
    try {
        const requestBody = req.body
        const availableConnectionDocument = await module.exports.createConnectionDocument(requestBody)
        await module.exports.queryCreateConnection(availableConnectionDocument)

        return res.status(200).send('created connection')
    } catch (err) {
        return res.status(500).send('error creating connection')
    }
}

module.exports.createConnectionDocument = function (requestBody) {
    return new Promise(async (resolve, reject) => {
        try {
            const availableConnectionDocument = {
                connection: {
                    active: true,
                    name: requestBody.name,
                    description: requestBody.description,
                    baseURL: requestBody.baseURL,
                    endpoint: requestBody.endpoint,
                    method: requestBody.method,
                    query: requestBody.query,
                    body: requestBody.body,
                    returns: requestBody.returns,
                    returnsTo: requestBody.returnsTo,
                    receives: requestBody.receives,
                    receivesFrom: requestBody.receivesFrom,
                }
            }
            return resolve(availableConnectionDocument)
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports.queryCreateConnection = function (availableConnectionDocument) {
    return new Promise(async (resolve, reject) => {
        try {
            await new AvailableConnectionModel(availableConnectionDocument).save()
            return resolve()
        } catch (err) {
            return reject(err)
        }
    })
}