const
    _ = require('lodash'),
    moment = require('moment'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    getStatuschecks: async (req, res, next) => {
        if (!req.body.projectId) throw new Error('Missing project')

        try {
            const findPayload = { sub: req.user.sub, projectId: req.body.projectId }
            const statuschecks = await IndexSchema.Statuscheck.find(findPayload)

            return res.status(200).send(statuschecks)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}