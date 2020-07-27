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
            // 'continue', 'stopWorkflow', 'repeatAttempt',
            onAdapterFailure: String,
        })],
        default: [{
            onAdapterFailure: 'stopWorkflow',
        }],
    },
    responseAdapters: {
        type: [new mongoose.Schema({
            adapterId: Schema.Types.ObjectId,
            // 'continue', 'stopWorkflow', 'repeatAttempt',
            onAdapterFailure: String,
        })],
        default: [{
            onAdapterFailure: 'stopWorkflow',
        }],
    },
}, { timestamps: true })

const TaskSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    request: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
    },
    ifTaskFails: {
        type: String, enum: [
            'continue', 'stopWorkflow', 'repeatAttempt',
        ]
    },
    repeatTaskPerResultPath: [{ type: String }],
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
    
    tasks: [{
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Task',
    }],
    timeout: { type: Number, default: 30 },
    onTimeout: { type: String, enum: [
        'timeout','send200Continue','send500Continue',
    ], default: 'timeout' }
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
    'Project': new mongoose.model('Project', ProjectSchema),
    'Request': new mongoose.model('Request', RequestSchema),
    'Task': new mongoose.model('Task', TaskSchema),
    'Workflow': new mongoose.model('Workflow', WorkflowSchema),
    'Instance': new mongoose.model('Instance', InstanceSchema),
    'Stat': new mongoose.model('Stat', StatSchema),

    'RequestSchema': RequestSchema,
}