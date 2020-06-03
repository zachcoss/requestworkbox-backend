const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

const instanceSchema = new mongoose.Schema({
    model: { type: String, default: 'Instance' },
    component: { type: String, default: 'instance' },
    sub: { type: String, required: true },

    isActive: { type: Boolean, default: true },

    workflow: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Workflow',
        autopopulate: true,
    },
}, { timestamps: true })

const workflowSchema = new mongoose.Schema({
    model: { type: String, default: 'Workflow' },
    component: { type: String, default: 'workflow' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    endpoints: [
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Endpoint',
            autopopulate: true,
        }
    ],
}, { timestamps: true })

const projectSchema = new mongoose.Schema({
    model: { type: String, default: 'Project' },
    component: { type: String, default: 'project' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

}, { timestamps: true })

const endpointSchema = new mongoose.Schema({
    model: { type: String, default: 'Endpoint' },
    component: { type: String, default: 'endpoint' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    // apikey, endpoint results
    parameters: [{ type: String }],

    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project',
        autopopulate: true,
    },

    preRequests: [{
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Request',
        autopopulate: true,
    }],

    request: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
        autopopulate: true,
    },

    postRequests: [{
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Request',
        autopopulate: true,
    }],

}, { timestamps: true })

const requestSchema = new mongoose.Schema({
    model: { type: String, default: 'Request' },
    component: { type: String, default: 'request' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    request: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Project Environment',
        autopopulate: true,
    }

}, { timestamps: true })


// For creating parameter values
// Inherits userEnvironment, results
const userEnvironmentSchema = new mongoose.Schema({
    model: { type: String, default: 'User Environment' },
    component: { type: String, default: 'userEnvironment' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    environmentType: {
        type: String, enum: [
            'parameter',
        ], default: 'parameter'
    },
    json: { type: String, required: true },

}, { timestamps: true })

// For creating requests
// For creating parameter values
// Inherits userEnvironment, results, projectEnvironment, parameters
// can meet { name: '', value: '${user/variableName}'  '${result/task}'  '${project/variableName}' '${parameter/parameterName}' } format
const projectEnvironmentSchema = new mongoose.Schema({
    model: { type: String, default: 'Project Environment' },
    component: { type: String, default: 'projectEnvironment' },
    sub: { type: String, required: true },

    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    projectId: { type: Schema.Types.ObjectId, required: true },

    environmentType: { type: String, enum: [
        'parameter',
        'request'
    ], required: true },
    json: { type: String, required: true },

}, { timestamps: true })

const requestStatSchema = new mongoose.Schema({
    model: { type: String, default: 'Stat' },
    component: { type: String, default: 'stat' },
    sub: { type: String, required: true },

    componentType: { type: String, enum: [
        'instance','workflow','task','request',
    ], required: true },

    instanceId: { type: Schema.Types.ObjectId, required: true },
    workflowId: { type: Schema.Types.ObjectId, required: true },
    endpointId: { type: Schema.Types.ObjectId, required: true },
    requestId: { type: Schema.Types.ObjectId },
    requestName: { type: String },
    start: { type: Date, required: true },
    code: { type: String },
    message: { type: String, },
    end: { type: Date, },
}, { timestamps: true })

module.exports = {
    // [instanceSchema.obj.component.default]: new mongoose.model(
    //     instanceSchema.obj.model.default,
    //     instanceSchema
    // ),
    // [workflowSchema.obj.component.default]: new mongoose.model(
    //     workflowSchema.obj.model.default,
    //     workflowSchema
    // ),
    // [projectSchema.obj.component.default]: new mongoose.model(
    //     projectSchema.obj.model.default,
    //     projectSchema
    // ),
    // [endpointSchema.obj.component.default]: new mongoose.model(
    //     endpointSchema.obj.model.default,
    //     endpointSchema
    // ),
    // [requestSchema.obj.component.default]: new mongoose.model(
    //     requestSchema.obj.model.default,
    //     requestSchema
    // ),
    [userEnvironmentSchema.obj.component.default]: new mongoose.model(
        userEnvironmentSchema.obj.model.default,
        userEnvironmentSchema
    ),
    // [projectEnvironmentSchema.obj.component.default]: new mongoose.model(
    //     projectEnvironmentSchema.obj.model.default,
    //     projectEnvironmentSchema
    // ),
    // [requestStatSchema.obj.component.default]: new mongoose.model(
    //     requestStatSchema.obj.model.default,
    //     requestStatSchema
    // ),
}