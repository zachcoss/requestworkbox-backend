const
    _ = require('lodash'),
    moment = require('moment'),
    IndexSchema = require('../tools/schema').schema;

module.exports = {
    getSchedule: async (req, res, next) => {
        if (!req.body.date) throw new Error('Missing date')

        try {
            const startDate = moment(req.body.date).startOf('day').toDate()
            const endDate = moment(req.body.date).endOf('day').toDate()
            const findPayload = {
                sub: req.user.sub,
                workflow: req.body.workflow,
                date: {
                    $gt: startDate,
                    $lt: endDate,
                }
            }

            const schedule = await IndexSchema.Queue.find(findPayload)

            console.log('found schedule')
            console.log(schedule)
            return res.status(200).send(schedule)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}