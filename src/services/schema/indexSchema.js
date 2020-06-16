const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

const ProjectSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    name: { type: String, required: true, default: 'Untitled Project' },
}, { timestamps: true })

const RequestSchema = new mongoose.Schema({
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
    name: { type: String },
    description: { type: String },
    
    requestType: { type: String, enum: [
        'request','plugin'
    ]},
    pluginType: { type: String, enum: [
        'request', 'response', 'task'
    ]},

    ifRequestPluginFails: {
        type: String, enum: [
            'continue', 'stopWorkflow', 'repeatAttempt',
        ]
    },
    ifResponsePluginFails: {
        type: String, enum: [
            'continue', 'stopWorkflow', 'repeatAttempt',
        ]
    },

    requestAvailableTo: {
        type: String, enum: [
            'any', 'project', 'none'
        ]
    },
    responseAvailableTo: {
        type: String, enum: [
            'any', 'project', 'none'
        ]
    },

    requestAvailableAs: { type: String, },
    responseAvailableAs: { type: String },

    successCodes: { type: String },
    errorCodes: { type: String },

    requestPlugins: [{
        type: Schema.Types.ObjectId,
        ref: 'Request',
    }],
    responsePlugins: [{
        type: Schema.Types.ObjectId,
        ref: 'Request',
    }],
    
    url: { type: String },
    parameters: { type: mongoose.Schema.Types.Mixed },
    query: { type: mongoose.Schema.Types.Mixed },
    headers: { type: mongoose.Schema.Types.Mixed },
    cookies: { type: mongoose.Schema.Types.Mixed },
    body: [{ type: mongoose.Schema.Types.Mixed }],
    permissions: { type: mongoose.Schema.Types.Mixed },
    plugins: { type: mongoose.Schema.Types.Mixed },
    details: { type: mongoose.Schema.Types.Mixed },

    query: { type: mongoose.Schema.Types.Mixed },
    path: { type: mongoose.Schema.Types.Mixed },
    header: { type: mongoose.Schema.Types.Mixed },
    body: { type: mongoose.Schema.Types.Mixed },

    method: {
        type: String, enum: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'UPDATE'
        ]
    },
    protocol: {
        type: String, enum: [
            'HTTP',
            'HTTPS',
        ]
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