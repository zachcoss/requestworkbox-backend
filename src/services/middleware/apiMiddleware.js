const 
    AvailableServiceClass = require('../api/availableAPIService'),
    InstalledServiceClass = require('../api/installedAPIService');

module.exports = {
    create: async function (req, res) {
        try {
            const AvailableService = new AvailableServiceClass(req)
            const doc = await AvailableService.create()

            return res.status(200).send(doc)
        } catch (err) {
            throw new Error(err)
        }
    },
    install: async function (req, res) {
        try {
            const InstalledService = new InstalledServiceClass(req)
            const doc = await InstalledService.install()

            return res.status(200).send(doc)
        } catch (err) {
            throw new Error(err)
        }
    },
    authorize: async function (req, res) {
        try {
            const InstalledService = new InstalledServiceClass(req)
            const doc = await InstalledService.authorize()

            return res.status(200).send(doc)
        } catch (err) {
            throw new Error(err)
        }
    },
    availableAPI: async function (req, res) {
        try {
            const docs = await AvailableServiceClass.availableAPI()

            return res.status(200).send(docs)
        } catch (err) {
            throw new Error(err)
        }
    },
    installedAPI: async function (req, res) {
        try {
            const InstalledService = new InstalledServiceClass(req)
            const docs = await InstalledService.installedAPI()

            return res.status(200).send(docs)
        } catch (err) {
            throw new Error(err)
        }
    },
}