const
    _ = require('lodash'),
    IndexSchema = require('../tools/schema').schema,
    Tokens = require('../tools/tokens').tokens;

module.exports = {
    healthcheck: async function (req, res, next) {
        try {
            return res.status(200).send('OK')
        } catch (err) {
            return res.status(500).send('ERROR')
        }
    },
    interceptor: async function (req, res, next) {
        try {
            if (req.user && req.user.sub && _.isString(req.user.sub)) return next()
            else if (req.headers['x-api-key']) {
                const sub = await Tokens.validateToken(IndexSchema, req.headers['x-api-key'])
                req.user = { sub, }

                return next()
            } else {
                if (_.includes(req.path, '/return-workflow/')) return next()
                else if (_.includes(req.path, '/queue-workflow/')) return next()
                else if (_.includes(req.path, '/schedule-workflow/')) return next()
                else if (_.includes(req.path, '/statuscheck-workflow/')) return next()
                else if (_.includes(req.path, '/webhooks/')) return next()

                return res.status(401).send('Authorization not found.')
            }
        } catch (err) {
            console.log('Interceptor error', err)
            return res.status(401).send('Token not found.')
        }
    },
}