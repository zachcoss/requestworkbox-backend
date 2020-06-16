const
    _ = require('lodash'),
    IndexSchema = require('../schema/indexSchema');

module.exports = {
    all: async (req, res, next) => {
        try {
            const schema = req.path.replace('/developer/components/', '').replace('/all', '')
            console.log('schema', schema)
            const populate = req.query && req.query.populate && (req.query.populate === true || req.query.populate === 'true') || false
            const docs = await
                IndexSchema[schema]
                    .find({
                        sub: req.user.sub,
                    }, {}, { autopopulate: Boolean(populate) })
                    .exec()

            return res.status(200).send(docs)
        } catch (err) {
            return res.status(500).send(err)
        }
    },
    createProject: async (req, res, next) => {
        try {
            const project = await new IndexSchema.Project({ sub: req.user.sub, name: req.body.name })
            return res.status(200).send({ _id: project._id })
        } catch(err) {
            return res.status(500).send(err)
        }
    }
}