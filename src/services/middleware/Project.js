const
    ValidateProject = require('../validate/Project');

module.exports = {
    createProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.createProject.validate(req)
            const authorize = await ValidateProject.createProject.authorize(payload)
            const request = await ValidateProject.createProject.request(authorize)
            return ValidateProject.createProject.response(request, res)
        } catch (err) {
            return ValidateProject.createProject.error(err, res)
        }
    },
    listProjects: async (req, res, next) => {
        try {
            const payload = ValidateProject.listProjects.validate(req)
            const authorize = await ValidateProject.listProjects.authorize(payload)
            const request = await ValidateProject.listProjects.request(authorize)
            return ValidateProject.listProjects.response(request, res)
        } catch (err) {
            return ValidateProject.listProjects.error(err, res)
        }
    },
    listTeamProjects: async (req, res, next) => {
        try {
            const payload = ValidateProject.listTeamProjects.validate(req)
            const authorize = await ValidateProject.listTeamProjects.authorize(payload)
            const request = await ValidateProject.listTeamProjects.request(authorize)
            return ValidateProject.listTeamProjects.response(request, res)
        } catch (err) {
            return ValidateProject.listTeamProjects.error(err, res)
        }
    },
    getProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.getProject.validate(req)
            const authorize = await ValidateProject.getProject.authorize(payload)
            const request = await ValidateProject.getProject.request(authorize)
            return ValidateProject.getProject.response(request, res)
        } catch (err) {
            return ValidateProject.getProject.error(err, res)
        }
    },
    updateProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.updateProject.validate(req)
            const authorize = await ValidateProject.updateProject.authorize(payload)
            const request = await ValidateProject.updateProject.request(authorize)
            return ValidateProject.updateProject.response(request, res)
        } catch (err) {
            return ValidateProject.updateProject.error(err, res)
        }
    },
    archiveProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.archiveProject.validate(req)
            const authorize = await ValidateProject.archiveProject.authorize(payload)
            const request = await ValidateProject.archiveProject.request(authorize)
            return ValidateProject.archiveProject.response(request, res)
        } catch (err) {
            return ValidateProject.archiveProject.error(err, res)
        }
    },
    restoreProject: async (req, res, next) => {
        try {
            const payload = ValidateProject.restoreProject.validate(req)
            const authorize = await ValidateProject.archiveProject.authorize(payload)
            const request = await ValidateProject.restoreProject.request(authorize)
            return ValidateProject.restoreProject.response(request, res)
        } catch (err) {
            return ValidateProject.restoreProject.error(err, res)
        }
    },
}