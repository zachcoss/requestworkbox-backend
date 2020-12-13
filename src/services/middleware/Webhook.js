const
    _ = require('lodash'),
    moment = require('moment'),
    IndexSchema = require('../tools/schema').schema,
    Stats = require('../tools/stats').stats,
    S3 = require('../tools/s3').S3,
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    readFile = util.promisify(fs.readFile),
    writeFile = util.promisify(fs.writeFile),
    mkdirp = require('mkdirp');

const ValidateWebhook = require('../validate/Webhook');

module.exports = {
    createWebhook: async (req, res, next) => {
        try {
            const payload = ValidateWebhook.createWebhook.validate(req)
            const request = await ValidateWebhook.createWebhook.request(payload)
            return ValidateWebhook.createWebhook.response(request, res)
        } catch (err) {
            return ValidateWebhook.createWebhook.error(err, res)
        }
    },
    listWebhooks: async (req, res, next) => {
        try {
            const payload = ValidateWebhook.listWebhooks.validate(req)
            const request = await ValidateWebhook.listWebhooks.request(payload)
            return ValidateWebhook.listWebhooks.response(request, res)
        } catch (err) {
            return ValidateWebhook.listWebhooks.error(err, res)
        }
    },
    getWebhook: async (req, res, next) => {
        try {
            const payload = ValidateWebhook.getWebhook.validate(req)
            const request = await ValidateWebhook.getWebhook.request(payload)
            return ValidateWebhook.getWebhook.response(request, res)
        } catch (err) {
            return ValidateWebhook.getWebhook.error(err, res)
        }
    },
    saveWebhookChanges: async (req, res, next) => {
        try {
            const payload = ValidateWebhook.saveWebhookChanges.validate(req)
            const request = await ValidateWebhook.saveWebhookChanges.request(payload)
            return ValidateWebhook.saveWebhookChanges.response(request, res)
        } catch (err) {
            return ValidateWebhook.saveWebhookChanges.error(err, res)
        }
    },
    getWebhookDetails: async (req, res, next) => {
        try {
            const payload = ValidateWebhook.getWebhookDetails.validate(req)
            const request = await ValidateWebhook.getWebhookDetails.request(payload)
            return ValidateWebhook.getWebhookDetails.response(request, res)
        } catch (err) {
            return ValidateWebhook.getWebhookDetails.error(err, res)
        }
    },
    acceptWebhook: async (req, res, next) => {
        try {
            const payload = ValidateWebhook.acceptWebhook.validate(req)
            const request = await ValidateWebhook.acceptWebhook.request(payload)
            return ValidateWebhook.acceptWebhook.response(request, res)
        } catch (err) {
            return ValidateWebhook.acceptWebhook.error(err, res)
        }
    },
    downloadWebhookDetail: async (req, res, next) => {
        try {
            const payload = ValidateWebhook.downloadWebhookDetail.validate(req)
            const request = await ValidateWebhook.downloadWebhookDetail.request(payload)
            return ValidateWebhook.downloadWebhookDetail.response(request, res)
        } catch (err) {
            return ValidateWebhook.downloadWebhookDetail.error(err, res)
        }
    },
}