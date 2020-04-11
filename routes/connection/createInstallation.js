const
    OauthService = require('../oauth/services'),
    InstalledConnectionModel = require('../../schema/connection').installedConnectionModel;

module.exports.createInstallation = async function (req, res, next) {
    try {
        const requestBody = req.body
        const installedConnectionDocument = await module.exports.createInstallationDocument(requestBody)
        await module.exports.queryCreateInstallation(installedConnectionDocument)
        const authURL = await OauthService.generateAuthURL(user)

        res.status(200).send(authURL)
    } catch (err) {
        res.status(500).send('error installing connection')
    }
}

module.exports.createInstallationDocument = function (requestBody) {
    return new Promise(async (resolve, reject) => {
        try {
            const installedConnectionDocument = {
                active: false,
                connectionId: requestBody.connectionId,
                accountId: requestBody.accountId,
            }
            return resolve(installedConnectionDocument)
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports.queryCreateInstallation = function (installedConnectionDocument) {
    return new Promise(async (resolve, reject) => {
        try {
            await new InstalledConnectionModel(installedConnectionDocument).save()
            return resolve()
        } catch (err) {
            return reject(err)
        }
    })
}