const
    OauthService = require('../oauth/services'),
    InstalledConnectionModel = require('../../schema/connection').installedConnectionModel;

module.exports.authorizeInstallation = async function (req, res, next) {
    try {
        await OauthService.verifyAuthCode(user, userauthcode)

        const updateObject = await module.exports.createUpdateObject()
        const queryObject = await module.exports.createQueryObject()
        await module.exports.updateInstalledConnection(queryObject, updateObject)

        res.status(200).send('completed authorization')
    } catch (err) {
        res.status(500).send('error authorizing')
    }
}

module.exports.createUpdateObject = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const update = {
                active: true
            }
            return resolve(update)
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports.createQueryObject = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const update = {
                active: true
            }
            return resolve(update)
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports.updateInstalledConnection = function (queryObject, updateObject) {
    return new Promise(async (resolve, reject) => {
        try {
            await InstalledConnectionModel.findOneAndUpdate(queryObject, updateObject).exec()
            return resolve()
        } catch (err) {
            return reject(err)
        }
    })
}