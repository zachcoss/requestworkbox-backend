const
    ValidateTeam = require('../validate/Team');

module.exports = {
    createInvite: async (req, res, next) => {
        try {
            const payload = ValidateTeam.createInvite.validate(req)
            const authorize = await ValidateTeam.createInvite.authorize(payload)
            const request = await ValidateTeam.createInvite.request(authorize)
            return ValidateTeam.createInvite.response(request, res)
        } catch (err) {
            return ValidateTeam.createInvite.error(err, res)
        }
    },
    acceptInvite: async (req, res, next) => {
        try {
            const payload = ValidateTeam.acceptInvite.validate(req)
            const authorize = await ValidateTeam.acceptInvite.authorize(payload)
            const request = await ValidateTeam.acceptInvite.request(authorize)
            return ValidateTeam.acceptInvite.response(request, res)
        } catch (err) {
            return ValidateTeam.acceptInvite.error(err, res)
        }
    },
    listTeam: async (req, res, next) => {
        try {
            const payload = ValidateTeam.listTeam.validate(req)
            const authorize = await ValidateTeam.listTeam.authorize(payload)
            const request = await ValidateTeam.listTeam.request(authorize)
            return ValidateTeam.listTeam.response(request, res)
        } catch (err) {
            return ValidateTeam.listTeam.error(err, res)
        }
    },
    listInvites: async (req, res, next) => {
        try {
            const payload = ValidateTeam.listInvites.validate(req)
            const authorize = await ValidateTeam.listInvites.authorize(payload)
            const request = await ValidateTeam.listInvites.request(authorize)
            return ValidateTeam.listInvites.response(request, res)
        } catch (err) {
            return ValidateTeam.listInvites.error(err, res)
        }
    },
    removeInvite: async (req, res, next) => {
        try {
            const payload = ValidateTeam.removeInvite.validate(req)
            const authorize = await ValidateTeam.removeInvite.authorize(payload)
            const request = await ValidateTeam.removeInvite.request(authorize)
            return ValidateTeam.removeInvite.response(request, res)
        } catch (err) {
            return ValidateTeam.removeInvite.error(err, res)
        }
    },
    updateTeam: async (req, res, next) => {
        try {
            const payload = ValidateTeam.updateTeam.validate(req)
            const authorize = await ValidateTeam.updateTeam.authorize(payload)
            const request = await ValidateTeam.updateTeam.request(authorize)
            return ValidateTeam.updateTeam.response(request, res)
        } catch (err) {
            return ValidateTeam.updateTeam.error(err, res)
        }
    },
}