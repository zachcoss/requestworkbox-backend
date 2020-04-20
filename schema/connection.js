const mongoose = require('mongoose'),
    ObjectId = mongoose.ObjectId;

const availableConnectionSchema = new mongoose.Schema({
    sub: String,
    active: {
        type: Boolean,
        default: true
    },
    connection: {
        name: String,
        description: String,
        baseURL: String,
        endpoint: String,
        method: String,
        query: String,
        body: String,
        returns: String,
        returnsTo: String,
        receives: String,
        receivesFrom: String
    },
})

const installedConnectionSchema = new mongoose.Schema({
    sub: String,
    active: {
        type: Boolean,
        default: false
    },
    connectionId: ObjectId,
})

module.exports = {
    availableConnectionModel: mongoose.model('availableConnection', availableConnectionSchema),
    installedConnectionModel: mongoose.model('installedConnection', installedConnectionSchema)
}