const mongoose = require('mongoose'),
    ObjectId = mongoose.ObjectId;

const availableConnectionSchema = new mongoose.Schema({
    connectionName: String,
    connectionBaseURL: String,
    connectionHealthCheckEndpoint: String,
    connectionHealthCheckMethod: String,
    connectionPrimaryEndpoint: String,
    connectionPrimaryMethod: String
})

const installedConnectionSchema = new mongoose.Schema({
    connectionId: ObjectId,
    accountId: ObjectId
})

module.exports = {
    availableConnectionModel: mongoose.model('availableConnection', availableConnectionSchema),
    installedConnectionModel: mongoose.model('installedConnection', installedConnectionSchema)
}