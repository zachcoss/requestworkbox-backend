const
    schema = require('../schema/apiSchema'),
    ExpressRequest = require('../../shared/plugins/network/expressRequest');

class AvailableService extends ExpressRequest {

    constructor(req) {
        super(req)
    }

    async create() {
        // create and return document based on body payload
        const doc = await new schema.available(this.body).save()
        return doc
    }

    static async availableAPI() {
        const filter = {}
        filter.active = true

        const docs = await schema.available.find(filter).exec()
        return docs
    }
    
}

module.exports = AvailableService