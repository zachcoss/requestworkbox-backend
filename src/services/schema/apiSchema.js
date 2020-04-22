const 
    mongoose = require('mongoose');

const available = new mongoose.Schema({
    // _id || api_id
    sub: String,
    active: {
        type: Boolean,
        default: true,
    },
    details: {
        name: String,
    },
    config: {
        baseURLs: {
            local: String,
            prod: String,
        },
        oauth: {
            register: {
                path: String,
            },
            authorize: {
                path: String,
            },
            scopes: [String],
        },
    },
}, {
    collection: 'available',
    timestamps: true
})

const installed = new mongoose.Schema({
    // _id || installation_id
    sub: String,
    status: {
        type: String,
        default: 'pending'
    },
    api_id: mongoose.Types.ObjectId,
}, {
    collection: 'installed',
    timestamps: true
})

module.exports = {
    available: mongoose.model('available', available),
    installed: mongoose.model('installed', installed),
}