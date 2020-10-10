const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

const KeyValueSchema = new mongoose.Schema({
    key: String,
    value: String,
    valueType: { type: String, enum: ['textInput','storage','runtimeResult','incomingField'] }
})

const KeyValueDefault = () => {
    return {
        key: '',
        value: '',
        valueType: 'textInput'
    }
}

const FeedbackSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    sub: { type: String, required: true },
    feedbackType: { type: String, required: true, default: 'general' },
    feedbackText: { type: String, },
}, { timestamps: true })

const StorageSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    sub: { type: String, required: true },
    name: { type: String, required: true, default: 'Untitled Storage' },
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
    storageType: { type: String, enum: ['text', 'file'] }
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
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
        method: {type: String, default: 'GET'},
        url: {type: String, default: 'https://api.com'},
        name: {type: String, default: 'API'},
    },
    query: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
    },
    headers: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
    },
    body: {
        type: [ KeyValueSchema ],
        default: [ KeyValueDefault() ]
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
        })],
        default: [{}],
    },
}, { timestamps: true })

const InstanceSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    sub: { type: String, required: true },
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
    },
    workflow: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Workflow',
    },
    workflowName: { type: String },
    stats: [{
        type: Schema.Types.ObjectId,
        ref: 'Stat',
        autopopulate: true
    }]
}, { timestamps: true })

const StatSchema = new mongoose.Schema({
    active: { type: Boolean, default: true },
    instance: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Instance',
    },
    requestName: { type: String },
    status: { type: Number },
    statusText: { type: String },
    requestType: { type: String },
    requestId: { type: Schema.Types.ObjectId },
    requestPayload: { type: mongoose.Schema.Types.Mixed },
    responsePayload: { type: mongoose.Schema.Types.Mixed },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number },
    responseSize: { type: Number },
    responseType: { type: String }, 
}, { timestamps: true })

module.exports = {
    'Feedback': new mongoose.model('Feedback', FeedbackSchema),
    'Storage': new mongoose.model('Storage', StorageSchema),
    'Project': new mongoose.model('Project', ProjectSchema),
    'Request': new mongoose.model('Request', RequestSchema),
    'Workflow': new mongoose.model('Workflow', WorkflowSchema),
    'Instance': new mongoose.model('Instance', InstanceSchema),
    'Stat': new mongoose.model('Stat', StatSchema),

    'RequestSchema': RequestSchema,
}