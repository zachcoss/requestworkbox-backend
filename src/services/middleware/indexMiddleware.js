const
    _ = require('lodash'),
    indexSchema = require('../schema/indexSchema'),
    instanceTools = require('../tools/instance'),
    moment = require('moment'),
    CronJob = require('cron').CronJob;

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
            if (!req.user || !req.user.sub) {
                return res.status(500).send('user not found')
            } else {
                console.log('current user: ', req.user.sub)
                return next()
            }
        } catch (err) {
            console.log(err)
            return res.status(500).send('error intercepting user')
        }
    },
    all: async (req, res, next) => {
        try {
            const schema = req.path.replace('/developer/components/', '').replace('/all', '')
            console.log('schema', schema)
            const populate = req.query && req.query.populate && (req.query.populate === true || req.query.populate === 'true') || false
            const docs = await 
                indexSchema[schema]
                .find({
                    sub: req.user.sub,
                }, {}, { autopopulate: Boolean(populate) })
                .exec()

            return res.status(200).send(docs)
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    create: async (req, res, next) => {
        try {
            const schema = req.path.replace('/developer/components/', '').replace('/create', '')
            const payload = _.assign(req.body, { sub: req.user.sub })
            const doc = new indexSchema[schema](payload)
            await doc.save()

            return res.status(200).send(doc)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    edit: async (req, res, next) => {
        try {
            const schema = req.path.replace('/developer/components/', '').replace('/edit', '')
            const payload = _.omit(_.assign(req.body, { sub: req.user.sub }), ['createdAt', 'updatedAt', '__v', 'component', 'model','sub','version'])
            const doc = await indexSchema[schema].findById(payload._id)

            _.each(payload, (value, key) => {
                doc[key] = value
            })

            await doc.save()
            
            return res.status(200).send(doc)
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    startWorkflow: async (req, res, next) => {
        try {
            const workflow = await indexSchema['workflow'].findById(req.params.workflow)

            const payload = {
                sub: req.user.sub,
                workflow: workflow._id,
            }
            const doc = new indexSchema['instance'](payload)
            await doc.save()

            const instanceJob = new CronJob({
                cronTime: moment().add(5, 'seconds'),
                onTick: () => {
                    instanceTools.start(doc._id)
                },
                start: true,
            })

            return res.status(200).send(doc)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}