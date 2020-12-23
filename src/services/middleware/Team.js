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
    removeFromTeam: async (req, res, next) => {
        try {
            const payload = ValidateTeam.removeFromTeam.validate(req)
            const authorize = await ValidateTeam.removeFromTeam.authorize(payload)
            const request = await ValidateTeam.removeFromTeam.request(authorize)
            return ValidateTeam.removeFromTeam.response(request, res)
        } catch (err) {
            return ValidateTeam.removeFromTeam.error(err, res)
        }
    },
}