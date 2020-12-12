const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../tools/schema').schema;

const
    ValidateWorkflow = require('../validate/Workflow');

module.exports = {
    createWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.createWorkflow.validate(req)
            const request = await ValidateWorkflow.createWorkflow.request(payload)
            return ValidateWorkflow.createWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.createWorkflow.error(err, res)
        }
    },
    listWorkflows: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.listWorkflows.validate(req)
            const request = await ValidateWorkflow.listWorkflows.request(payload)
            return ValidateWorkflow.listWorkflows.response(request, res)
        } catch (err) {
            return ValidateWorkflow.listWorkflows.error(err, res)
        }
    },
    getWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.getWorkflow.validate(req)
            const request = await ValidateWorkflow.getWorkflow.request(payload)
            return ValidateWorkflow.getWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.getWorkflow.error(err, res)
        }
    },
    saveWorkflowChanges: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.saveWorkflowChanges.validate(req)
            const request = await ValidateWorkflow.saveWorkflowChanges.request(payload)
            return ValidateWorkflow.saveWorkflowChanges.response(request, res)
        } catch (err) {
            return ValidateWorkflow.saveWorkflowChanges.error(err, res)
        }
    },
    addWorkflowTask: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.addWorkflowTask.validate(req)
            const request = await ValidateWorkflow.addWorkflowTask.request(payload)
            return ValidateWorkflow.addWorkflowTask.response(request, res)
        } catch (err) {
            return ValidateWorkflow.addWorkflowTask.error(err, res)
        }
    },
    deleteWorkflowTask: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.deleteWorkflowTask.validate(req)
            const request = await ValidateWorkflow.deleteWorkflowTask.request(payload)
            return ValidateWorkflow.deleteWorkflowTask.response(request, res)
        } catch (err) {
            return ValidateWorkflow.deleteWorkflowTask.error(err, res)
        }
    },
    archiveWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.archiveWorkflow.validate(req)
            const request = await ValidateWorkflow.archiveWorkflow.request(payload)
            return ValidateWorkflow.archiveWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.archiveWorkflow.error(err, res)
        }
    },
    restoreWorkflow: async (req, res, next) => {
        try {
            const payload = ValidateWorkflow.restoreWorkflow.validate(req)
            const request = await ValidateWorkflow.restoreWorkflow.request(payload)
            return ValidateWorkflow.restoreWorkflow.response(request, res)
        } catch (err) {
            return ValidateWorkflow.restoreWorkflow.error(err, res)
        }
    },
}