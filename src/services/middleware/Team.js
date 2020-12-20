const
    ValidateTeam = require('../validate/Team');

module.exports = {
    createInvite: async (req, res, next) => {
        try {
            const payload = ValidateTeam.createInvite.validate(req)
            const request = await ValidateTeam.createInvite.request(payload)
            return ValidateTeam.createInvite.response(request, res)
        } catch (err) {
            return ValidateTeam.createInvite.error(err, res)
        }
    },
    acceptInvite: async (req, res, next) => {
        try {
            const payload = ValidateTeam.acceptInvite.validate(req)
            const request = await ValidateTeam.acceptInvite.request(payload)
            return ValidateTeam.acceptInvite.response(request, res)
        } catch (err) {
            return ValidateTeam.acceptInvite.error(err, res)
        }
    },
    removeFromTeam: async (req, res, next) => {
        try {
            const payload = ValidateTeam.removeFromTeam.validate(req)
            const request = await ValidateTeam.removeFromTeam.request(payload)
            return ValidateTeam.removeFromTeam.response(request, res)
        } catch (err) {
            return ValidateTeam.removeFromTeam.error(err, res)
        }
    },
}