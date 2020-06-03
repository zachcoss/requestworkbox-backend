const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

const ContextSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    contextType: [{ type: String, enum: [
        'project',
        'request',
        'task',
    ]}],
    name: { type: String, },
    key: { type: String, required: true },
    template: { type: String, required: true },
    fallback: { type: String, required: true },
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    name: { type: String, required: true },
    context: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Context',
    },
}, { timestamps: true })

const RequestTemplateSchema = new mongoose.Schema({
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
    url: { type: String },
    query: { type: mongoose.Schema.Types.Mixed },
    path: { type: mongoose.Schema.Types.Mixed },
    header: { type: mongoose.Schema.Types.Mixed },
    body: { type: mongoose.Schema.Types.Mixed },
    context: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Context',
    },
}, { timestamps: true })

const RequestSchema = new mongoose.Schema({
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
    name: { type: String },
    description: { type: String },
    requestTemplate: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'RequestTemplate',
    },
    requestPermission: { type: String, enum: [
        'any', 'project','none'
    ] },
    requestAvailableAs: { type: String, },
    responsePermission: { type: String },
    responseAvailableAs: { type: String },
    requestType: { type: String, enum: [
        'request','transform'
    ]},
    transformType: { type: String, enum: [
        'request', 'response','task'
    ]},
    successCodes: [{type: String }],
    errorCodes: [ {type: String }],
    requestTransformers: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
    }],
    responseTransformers: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
    }],
    ifRequestTransformFails: { type: String, enum: [
        'continue', 'stopWorkflow', 'repeatAttempt',
    ]},
    ifResponseTransformFails: {
        type: String, enum: [
            'continue', 'stopWorkflow', 'repeatAttempt',
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
    context: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Context',
    },
}, { timestamps: true })

const WorkflowSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    name: { type: String, required: true },

    tasks: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Task',
    }],
    timeout: { type: Number },
    onTimeout: { type: String, enum: [
        'timeout','send200Continue','send500Continue',
    ]}
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
    'Context': new mongoose.model('Context', ContextSchema),
    'Project': new mongoose.model('Project', ProjectSchema),
    'RequestTemplate': new mongoose.model('RequestTemplate', RequestTemplateSchema),
    'Request': new mongoose.model('Request', RequestSchema),
    'Task': new mongoose.model('Task', TaskSchema),
    'Workflow': new mongoose.model('Workflow', WorkflowSchema),
    'Instance': new mongoose.model('Instance', InstanceSchema),
    'Stat': new mongoose.model('Stat', StatSchema),
}