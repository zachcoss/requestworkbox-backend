const
    _ = require('lodash'),
    IndexSchema = require('@requestworkbox/internal-tools').schema;

module.exports = {
    submitFeedback: async (req, res, next) => {
        try {
            const feedbackPayload = { sub: req.user.sub, ...req.body, }
            const feedback = new IndexSchema.Feedback(feedbackPayload)
            await feedback.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}