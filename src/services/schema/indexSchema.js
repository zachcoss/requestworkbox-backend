const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

const KeyValueSchema = new mongoose.Schema({
    key: String,
    value: String,
    acceptInput: Boolean,
})

const KeyValueDefault = () => {
    return {
        key: '',
        value: '',
        acceptInput: false,
    }
}

const environmentKeyValueSchema = new mongoose.Schema({
    key: String,
    value: String,
    active: Boolean,
})

const environmentKeyValueDefault = () => {
    return {
        key: '',
        value: '',
        active: true,
    }
}

const EnvironmentSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    sub: { type: String, required: true },
    name: { type: String, required: true, default: 'Untitled Environment' },
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
    data: {
        type: [ environmentKeyValueSchema ],
        default: [ environmentKeyValueDefault() ]
    },
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    name: { type: String, required: true, default: 'Untitled Project' },
}, { timestamps: true })

const RequestSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    sub: { type: String, required: true },
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
    url: {
        protocol: {type: String, default: 'HTTPS'},
        method: {type: String, default: 'GET'},
        url: {type: String, default: 'https://api.com'},
        name: {type: String, default: 'API'},
    },
    parameters: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
    },
    query: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
    },
    headers: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
    },
    cookies: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
    },
    body: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
    },
    taskPermissions: {
        requestAvailableAs: String,
        responseAvailableAs: String,
        // 'any', 'project', 'none'
        requestAvailableTo: { type: String, default: 'none'},
        // 'any', 'project', 'none'
        responseAvailableTo: { type: String, default: 'none'},
    },
    requestSettings: {
        description: String,
        // 'request','adapter'
        requestType: { type: String, default: 'request'},
        // 'request', 'response', 'task'
        adapterType: { type: String, default: 'request'},
        successCodes: String,
        errorCodes: String,
    },

    requestAdapters: {
        type: [new mongoose.Schema({
            adapterId: Schema.Types.ObjectId,
            timeout: String,
            // 'stop','send200Continue','send500Continue',
            onFailure: String,
            environment: Schema.Types.ObjectId,
            inputs: Schema.Types.Mixed
        })],
        default: [{
            timeout: '30seconds',
            onFailure: 'stop',
            inputs: {}
        }],
    },
    responseAdapters: {
        type: [new mongoose.Schema({
            adapterId: Schema.Types.ObjectId,
            timeout: String,
            // 'stop','send200Continue','send500Continue',
            onFailure: String,
            environment: Schema.Types.ObjectId,
            inputs: Schema.Types.Mixed
        })],
        default: [{
            timeout: '30seconds',
            onFailure: 'stop',
            inputs: {}
        }],
    },
}, { timestamps: true })

const WorkflowSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    sub: { type: String, required: true },
    name: { type: String, default: 'Untitled Workflow' },
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
    
    tasks: {
        type: [new mongoose.Schema({
            requestId: Schema.Types.ObjectId,
            timeout: String,
            // 'stop','send200Continue','send500Continue',
            onFailure: String,
            environment: Schema.Types.ObjectId,
            inputs: Schema.Types.Mixed
        })],
        default: [{
            timeout: '30seconds',
            onFailure: 'stop',
            inputs: {}
        }],
    },
    timeout: { type: String, default: '30seconds' },
    onFailure: { type: String, enum: [
        'stop','send200Continue','send500Continue',
    ], default: 'stop' },

    environment: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Environment',
    },
}, { timestamps: true })

const InstanceSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    workflow: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Workflow',
    },
}, { timestamps: true })

const StatSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    instance: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Workflow',
    },
    requestName: { type: String },
    payloadType: { type: String, enum: [
        'request','response'
    ]},
    size: { type: Number },
    statusCode: { type: Number },
    statusMessage: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

module.exports = {
    'Environment': new mongoose.model('Environment', EnvironmentSchema),
    'Project': new mongoose.model('Project', ProjectSchema),
    'Request': new mongoose.model('Request', RequestSchema),
    'Workflow': new mongoose.model('Workflow', WorkflowSchema),
    'Instance': new mongoose.model('Instance', InstanceSchema),
    'Stat': new mongoose.model('Stat', StatSchema),

    'RequestSchema': RequestSchema,
}