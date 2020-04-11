const
    axios = require('axios');

module.exports.generateAuthURL = function (user, connectionAuthEndpoint) {
    return new Promise(async (resolve, reject) => {
        try {
            const requestURL = connectionAuthEndpoint
            const requestBody = {
                user: user,
            }
            const response = await axios.get(requestURL).body(requestBody)
            const authURL = response.data

            return resolve(authURL)
        } catch (err) {
            return reject(err)
        }
    })
}

module.exports.verifyAuthCode = function (user, connectionAuthVerifyEndpoint, authCode) {
    return new Promise(async (resolve, reject) => {
        try {
            const requestURL = connectionAuthVerifyEndpoint
            const requestBody = {
                user: user,
                authCode: authCode,
            }
            const response = await axios.get(requestURL).body(requestBody)

            return resolve()
        } catch (err) {
            return reject(err)
        }
    })
}