const
    _ = require('lodash'),
    ApiSchemaBeta = require('../schema/apiSchema-beta');

module.exports = {
    all: async (req, res, next) => {
        try {
            const schema = req.path.replace('/developer/components/', '').replace('/all', '')
            console.log('schema', schema)
            const docs = await ApiSchemaBeta[schema].find({
                            sub: req.user.sub,
                        }).exec()

            return res.status(200).send(docs)
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    create: async (req, res, next) => {
        try {
            const schema = req.path.replace('/developer/components/', '').replace('/create', '')
            const payload = _.assign(req.body, { sub: req.user.sub })
            const doc = new ApiSchemaBeta[schema](payload)
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
            const doc = await ApiSchemaBeta[schema].findById(payload._id)

            _.each(payload, (value, key) => {
                doc[key] = value
            })

            await doc.save()
            
            return res.status(200).send(doc)
        } catch (err) {
            return res.status(500).send(err)
        }
    },
}