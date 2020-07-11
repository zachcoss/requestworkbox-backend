const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

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
        protocol: {type: String, default: ''},
        method: {type: String, default: ''},
        url: {type: String, default: ''},
        name: {type: String, default: ''},
    },
    parameters: [{
        key: String,
        value: String,
        acceptInput: Boolean,
    }],
    query: [{
        key: String,
        value: String,
        acceptInput: Boolean,
    }],
    headers: [{
        key: String,
        value: String,
        acceptInput: Boolean,
    }],
    cookies: [{
        key: String,
        value: String,
        acceptInput: Boolean,
    }],
    body: [{
        key: String,
        value: String,
        acceptInput: Boolean,
    }],
    taskPermissions: {
        requestAvailableAs: String,
        responseAvailableAs: String,
        // 'any', 'project', 'none'
        requestAvailableTo: String,
        // 'any', 'project', 'none'
        responseAvailableTo: String,
    },
    requestDetails: {
        description: String,
        // 'request','adapter'
        requestType: String,
        // 'request', 'response', 'task'
        adapterType: String,
        successCodes: String,
        errorCodes: String,
    },

    requestAdapters: [{
        adapterId: Schema.Types.ObjectId,
        // 'continue', 'stopWorkflow', 'repeatAttempt',
        onAdapterFailure: String,
    }],
    responseAdapters: [{
        adapterId: Schema.Types.ObjectId,
        // 'continue', 'stopWorkflow', 'repeatAttempt',
        onAdapterFailure: String,
    }],
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
    sub: { type: String, required: true },
    name: { type: String },

    tasks: [{
        type: Schema.Types.ObjectId,
        required: true,
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