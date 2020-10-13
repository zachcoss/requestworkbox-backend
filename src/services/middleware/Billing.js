const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema'),
    instanceTools = require('../tools/instance'),
    moment = require('moment'),
    socketService = require('../tools/socket'),
    CronJob = require('cron').CronJob;

module.exports = {
    getAccountType: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                billing = new IndexSchema.Billing({ sub: req.user.sub, accountType: 'free' })
                await billing.save()
            }
            if (!billing.accountType) {
                billing.accountType = 'free'
                await billing.save()
            }

            return res.status(200).send({ accountType: billing.accountType })
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    updateAccountType: async (req, res, next) => {
        try {
            const findPayload = { sub: req.user.sub }
            let billing = await IndexSchema.Billing.findOne(findPayload)

            if (!billing) {
                billing = new IndexSchema.Billing({ sub: req.user.sub, accountType: 'free' })
                await billing.save()
            }
            if (!billing.accountType) {
                billing.accountType = 'free'
                await billing.save()
            }

            billing.accountType = req.body.accountType || 'free'
            await billing.save()

            return res.status(200).send('OK')
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}