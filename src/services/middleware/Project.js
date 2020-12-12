const
    ValidateProject = require('../validate/Project');

module.exports = {
    createProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.createProject.validate(req)
            const request = await ValidateProject.createProject.request(payload)
            return ValidateProject.createProject.response(request, res)
        } catch (err) {
            return ValidateProject.createProject.error(err, res)
        }
    },
    listProjects: async (req, res, next) => {
        try {
            const payload = ValidateProject.listProjects.validate(req)
            const request = await ValidateProject.listProjects.request(payload)
            return ValidateProject.listProjects.response(request, res)
        } catch (err) {
            return ValidateProject.listProjects.error(err, res)
        }
    },
    getProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.getProject.validate(req)
            const request = await ValidateProject.getProject.request(payload)
            return ValidateProject.getProject.response(request, res)
        } catch (err) {
            return ValidateProject.getProject.error(err, res)
        }
    },
    updateProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.updateProject.validate(req)
            const request = await ValidateProject.updateProject.request(payload)
            return ValidateProject.updateProject.response(request, res)
        } catch (err) {
            return ValidateProject.updateProject.error(err, res)
        }
    },
    archiveProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.archiveProject.validate(req)
            const request = await ValidateProject.archiveProject.request(payload)
            return ValidateProject.archiveProject.response(request, res)
        } catch (err) {
            return ValidateProject.archiveProject.error(err, res)
        }
    },
    restoreProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.restoreProject.validate(req)
            const request = await ValidateProject.restoreProject.request(payload)
            return ValidateProject.restoreProject.response(request, res)
        } catch (err) {
            return ValidateProject.restoreProject.error(err, res)
        }
    },
}