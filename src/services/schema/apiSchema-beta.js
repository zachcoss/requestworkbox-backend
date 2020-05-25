const 
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.plugin(require('mongoose-autopopulate'))

const descriptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Description' },
    component: { type: String, default: 'description' },
    version: { type: String, default: 'v1' },

    descriptionShort: { type: String, required: true },
    descriptionLong: { type: String, required: true },
}, { timestamps: true })
 
const responseCodeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Response Code' },
    component: { type: String, default: 'responseCode' },
    version: { type: String, default: 'v1' },

    responseCodeStatusCode: { type: Number, required: true },
    responseCodeMessage: { type: String, required: true },
    responseCodeIsError: { type: Boolean, required: true },
}, { timestamps: true })

const parameterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Parameter' },
    component: { type: String, default: 'parameter' },
    version: { type: String, default: 'v1' },

    parameterPath: { type: String, required: true },
    parameterType: { type: String, required: true },
    parameterLocation: { type: String, required: true },
    parameterRequired: { type: Boolean, required: true },
}, { timestamps: true })
                        
const acceptOptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Accept Option' },
    component: { type: String, default: 'acceptOption' },
    version: { type: String, default: 'v1' },
    
    acceptOptionParameters: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Parameter',
        autopopulate: true,
    }],
}, { timestamps: true })

const responseOptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Response Option' },
    component: { type: String, default: 'responseOption' },
    version: { type: String, default: 'v1' },

    responseOptionParameters: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Parameter',
        autopopulate: true,
    }],
    responseOptionResponseCode: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Response Code',
        autopopulate: true,
    },
}, { timestamps: true })

const urlSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Url' },
    component: { type: String, default: 'url' },
    version: { type: String, default: 'v1' },

    urlProtocol: { type: String, required: true },
    urlBase: { type: String, required: true },
}, { timestamps: true })

const pathSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Path' },
    component: { type: String, default: 'path' },
    version: { type: String, default: 'v1' },

    pathUrl: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Url',
        autopopulate: true,
    },
    pathPath: { type: String, required: true },
    pathMethod: { type: String, required: true },
    pathBase: { type: String, required: true },
}, { timestamps: true })

const oAuthSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'O Auth' },
    component: { type: String, default: 'oAuth' },
    version: { type: String, default: 'v1' },

    oAuthRegistration: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Endpoint',
        autopopulate: true,
    },
    oAuthConfirmation: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Endpoint',
        autopopulate: true,
    },
}, { timestamps: true })

const apiKeySchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Api Key' },
    component: { type: String, default: 'apiKey' },
    version: { type: String, default: 'v1' },
    
    apiKeyHeader: { type: String, required: true },
    apiKeyHeaderValuePrefix: { type: String, required: true },
}, { timestamps: true })

const openAuthSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Open Auth' },
    component: { type: String, default: 'openAuth' },
    version: { type: String, default: 'v1' },
}, { timestamps: true })


const endpointSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Endpoint' },
    component: { type: String, default: 'endpoint' },
    version: { type: String, default: 'v1' },

    endpointPath: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'path',
        autopopulate: true,
    },
    endpointAuthorization: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'endpointAuthorizationModel',
        autopopulate: true,
    },
    endpointAuthorizationModel: {
        type: String,
        required: true,
        enum: ['O Auth', 'API Key', 'Open Auth'],
    },
    endpointAcceptOptions: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Accept Option',
        autopopulate: true,
    }],
    endpointResponseOptions: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Response Option',
        autopopulate: true,
    }],
}, { timestamps: true })

const apiEndpointSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Api Endpoint' },
    component: { type: String, default: 'apiEndpoint' },
    version: { type: String, default: 'v1' },

    apiEndpointStaging: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Endpoint',
        autopopulate: true,
    },
    apiEndpointProduction: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Endpoint',
        autopopulate: true,
    },
    apiEndpointDescription: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Description',
        autopopulate: true,
    },
}, { timestamps: true })

const apiSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sub: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    model: { type: String, default: 'Api' },
    component: { type: String, default: 'api' },
    version: { type: String, default: 'v1' },
    
    apiEndpoints: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Api Endpoint',
        autopopulate: true,
    }],
}, { timestamps: true })


module.exports = {
    [descriptionSchema.obj.component.default]: new mongoose.model(
        descriptionSchema.obj.model.default,
        descriptionSchema
    ),
    [responseCodeSchema.obj.component.default]: new mongoose.model(
        responseCodeSchema.obj.model.default,
        responseCodeSchema
    ),
    [parameterSchema.obj.component.default]: new mongoose.model(
        parameterSchema.obj.model.default,
        parameterSchema,
    ),
    [acceptOptionSchema.obj.component.default]: new mongoose.model(
        acceptOptionSchema.obj.model.default,
        acceptOptionSchema,
    ),
    [responseOptionSchema.obj.component.default]: new mongoose.model(
        responseOptionSchema.obj.model.default,
        responseOptionSchema,
    ),
    [urlSchema.obj.component.default]: new mongoose.model(
        urlSchema.obj.model.default,
        urlSchema,
    ),
    [pathSchema.obj.component.default]: new mongoose.model(
        pathSchema.obj.model.default,
        pathSchema,
    ),
    [oAuthSchema.obj.component.default]: new mongoose.model(
        oAuthSchema.obj.model.default,
        oAuthSchema,
    ),
    [apiKeySchema.obj.component.default]: new mongoose.model(
        apiKeySchema.obj.model.default,
        apiKeySchema,
    ),
    [openAuthSchema.obj.component.default]: new mongoose.model(
        openAuthSchema.obj.model.default,
        openAuthSchema,
    ),
    [endpointSchema.obj.component.default]: new mongoose.model(
        endpointSchema.obj.model.default,
        endpointSchema,
    ),
    [apiEndpointSchema.obj.component.default]: new mongoose.model(
        apiEndpointSchema.obj.model.default,
        apiEndpointSchema,
    ),
    [apiSchema.obj.component.default]: new mongoose.model(
        apiSchema.obj.model.default,
        apiSchema,
    ),
}