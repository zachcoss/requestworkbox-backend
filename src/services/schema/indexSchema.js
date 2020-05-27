const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

const globalContextSchema =  new mongoose.Schema({
    model: { type: String, default: 'Global Context' },
    component: { type: String, default: 'globalContext' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    url: { type: String, required: true },

    inputOptions: [{
        type: String, required: true, enum: [
            'context',
            'instance',
            'task',
            'sub',
        ]
    }],
    outputOptions: [{
        type: String, required: true, enum: [
            'cookies',
            'headers',
            'query',
            'protocol',
            'url',
            'path',
            'formData',
            'formDataUrlEncoded',
            'xml',
            'text',
            'javascript',
            'json',
            'html',
        ]
    }],
    
}, { timestamps: true })

const authContextSchema = new mongoose.Schema({
    model: { type: String, default: 'Auth Context' },
    component: { type: String, default: 'authContext' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    url: { type: String, required: true }, 

    inputOptions: [{
        type: String, required: true, enum: [
            'context',
            'instance',
            'task',
            'sub',
        ]
    }],
    outputOptions: [{
        type: String, required: true, enum: [
            'cookies',
            'headers',
            'query',
            'protocol',
            'url',
            'path',
            'formData',
            'formDataUrlEncoded',
            'xml',
            'text',
            'javascript',
            'json',
            'html',
        ]
    }],

}, { timestamps: true })

const requestContextSchema = new mongoose.Schema({
    model: { type: String, default: 'Request Context' },
    component: { type: String, default: 'requestContext' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    url: { type: String, required: true },

    inputOptions: [{
        type: String, required: true, enum: [
            'context',
            'instance',
            'task',
            'sub',
            'cookies',
            'headers',
            'query',
            'protocol',
            'url',
            'path',
            'formData',
            'formDataUrlEncoded',
            'xml',
            'text',
            'javascript',
            'json',
            'html',
        ]
    }],
    outputOptions: [{
        type: String, required: true, enum: [
            'cookies',
            'headers',
            'query',
            'protocol',
            'url',
            'path',
            'formData',
            'formDataUrlEncoded',
            'xml',
            'text',
            'javascript',
            'json',
            'html',
        ]
    }],
}, { timestamps: true })

const responseContextSchema = new mongoose.Schema({
    model: { type: String, default: 'Response Context' },
    component: { type: String, default: 'responseContext' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    url: { type: String, required: true },

    inputOptions: [{
        type: String, required: true, enum: [
            'context',
            'instance',
            'task',
            'sub',
            'statusCode',
            'statusMessage',
            'cookies',
            'headers',
            'query',
            'protocol',
            'url',
            'path',
            'formData',
            'formDataUrlEncoded',
            'xml',
            'text',
            'javascript',
            'json',
            'html',
        ]
    }],
    outputOptions: [{
        type: String, required: true, enum: [
            'statusCode',
            'statusMessage',
            'cookies',
            'headers',
            'query',
            'protocol',
            'url',
            'path',
            'formData',
            'formDataUrlEncoded',
            'xml',
            'text',
            'javascript',
            'json',
            'html',
        ]
    }],
}, { timestamps: true })

const taskSchema = new mongoose.Schema({
    model: { type: String, default: 'Task' },
    component: { type: String, default: 'task' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    size: { type: Number, default: 25, enum: [
        25, 50, 100, 250, 500, 1000
    ] },
    
    globalContext: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Global Context',
        autopopulate: true,
    },
    authContext: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Auth Context',
        autopopulate: true,
    },
    requestContext: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Request Context',
        autopopulate: true,
    },
    responseContext: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Response Context',
        autopopulate: true,
    },

}, { timestamps: true })

const workflowSchema = new mongoose.Schema({
    model: { type: String, default: 'Workflow' },
    component: { type: String, default: 'workflow' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    frequency: { type: String, default: 'api' },
    lastRun: { type: Date },
    nextRun: { type: Date },

    tasks: [
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Task',
            autopopulate: true,
        }
    ],
}, { timestamps: true })

const instanceSchema = new mongoose.Schema({
    model: { type: String, default: 'Instance' },
    component: { type: String, default: 'instance' },
    sub: { type: String, required: true },
    
    isActive: { type: Boolean, default: false },
    closed: { type: Boolean, default: false },
    processId: { type: Schema.Types.ObjectId },
    
    workflow: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Workflow',
        autopopulate: true,
    },
}, { timestamps: true })

const statSchema = new mongoose.Schema({
    model: { type: String, default: 'Stat' },
    component: { type: String, default: 'stat' },
    sub: { type: String, required: true },
    instance: { type: Schema.Types.ObjectId, required: true },
    component: { type: Schema.Types.ObjectId, required: true },
    start: { type: Date, required: true },
    code: { type: String },
    message: { type: String, },
    end: { type: Date, },
}, { timestamps: true })

module.exports = {
    [globalContextSchema.obj.component.default]: new mongoose.model(
        globalContextSchema.obj.model.default,
        globalContextSchema
    ),
    [authContextSchema.obj.component.default]: new mongoose.model(
        authContextSchema.obj.model.default,
        authContextSchema
    ),
    [requestContextSchema.obj.component.default]: new mongoose.model(
        requestContextSchema.obj.model.default,
        requestContextSchema
    ),
    [responseContextSchema.obj.component.default]: new mongoose.model(
        responseContextSchema.obj.model.default,
        responseContextSchema
    ),
    [taskSchema.obj.component.default]: new mongoose.model(
        taskSchema.obj.model.default,
        taskSchema
    ),
    [workflowSchema.obj.component.default]: new mongoose.model(
        workflowSchema.obj.model.default,
        workflowSchema
    ),
    [instanceSchema.obj.component.default]: new mongoose.model(
        instanceSchema.obj.model.default,
        instanceSchema
    ),
    [statSchema.obj.component.default]: new mongoose.model(
        statSchema.obj.model.default,
        statSchema
    ),
}