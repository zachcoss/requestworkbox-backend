const 
  axios = require('axios'),
  express = require('express'),
  router = express.Router(),
  googleURL = process.env.VUE_APP_GOOGLE_URL,
  connectionSchema = require('../schema/connection'),
  AvailableConnectionModel = connectionSchema.availableConnectionModel,
  InstalledConnectionModel = connectionSchema.installedConnectionModel;

module.exports.createAvailableConnectionDocumentFromRequestBody = function(requestBody) {
  return new Promise( async (resolve, reject) => {
    try {
      const availableConnectionDocument = {
        connection: {
          active: true,
          name: requestBody.name,
          description: requestBody.description,
          baseURL: requestBody.baseURL,
          endpoint: requestBody.endpoint,
          method: requestBody.method,
          query: requestBody.query,
          body: requestBody.body,
          returns: requestBody.returns,
          returnsTo: requestBody.returnsTo,
          receives: requestBody.receives,
          receivesFrom: requestBody.receivesFrom,
        }
      }
      return resolve(availableConnectionDocument)
    } catch(err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createAvailableConnection = function (availableConnectionDocument) {
  return new Promise(async (resolve, reject) => {
    try {
      await new AvailableConnectionModel(availableConnectionDocument).save()
      return resolve()
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createQueryObjectForActiveAvailableConnections = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const queryObject = { active: true }
      return resolve(queryObject)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.queryAvailableConnections = function (queryObject) {
  return new Promise(async (resolve, reject) => {
    try {
      const availableConnections = await AvailableConnectionModel.find(queryObject).exec()
      return resolve(availableConnections)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createInstalledConnectionDocumentFromRequestBody = function (requestBody) {
  return new Promise(async (resolve, reject) => {
    try {
      const installedConnectionDocument = {
        active: false,
        connectionId: requestBody.connectionId,
        accountId: requestBody.accountId,
      }
      return resolve(installedConnectionDocument)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createInstalledConnection = function (installedConnectionDocument) {
  return new Promise(async (resolve, reject) => {
    try {
      await new InstalledConnectionModel(installedConnectionDocument).save()
      return resolve()
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createPipelineForActiveInstalledConnections = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const pipeline = [
        {
          $match: {
            active: true
          }
        },
        {
          $lookup: {
            from: 'availableconnections',
            localField: 'connectionId',
            foreignField: '_id',
            as: 'connection'
          }
        },
        { $unwind: '$connection' }
      ]
      return resolve(pipeline)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.queryInstalledConnections = function (pipeline) {
  return new Promise(async (resolve, reject) => {
    try {
      const installedConnections = await InstalledConnectionModel.aggregate(pipeline).exec()
      return resolve(installedConnections)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createQueryObjectForUpdatingInstalledConnectionFromRequest = function (request) {
  return new Promise(async (resolve, reject) => {
    try {
      const queryObject = { _id: request.params.connectionId }
      return resolve(queryObject)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createUpdateObjectForUpdatingInstalledConnectionFromRequest = function (request) {
  return new Promise(async (resolve, reject) => {
    try {
      const updateObject = request.body
      return resolve(updateObject)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.updateInstalledConnection = function (queryObject, updateObject) {
  return new Promise(async (resolve, reject) => {
    try {
      await InstalledConnectionModel.findOneAndUpdate(queryObject, updateObject).exec()
      return resolve()
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.generateAuthURL = function (user) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(user)
      const requestURL = `${googleURL}/auth/install/${user}`
      const authURLResponse = await axios.get(requestURL)
      const authURL = authURLResponse.data
      console.log(authURL)
      return resolve(authURL)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.verifyUserAuthCode = function (user, userAuthCode) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(user)
      console.log(userAuthCode)
      await axios.get(`${googleURL}/auth/install/${user}/${userAuthCode}`)
      return resolve()
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

module.exports.createUpdateObjectToActivateInstallation = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const update = { active: true }
      return resolve(update)
    } catch (err) {
      console.log(err)
      return reject()
    }
  })
}

// Create available connection
router.post('/available-connections', async function (req, res, next) {
  try {
    const availableConnectionDocument = await module.exports.createAvailableConnectionDocumentFromRequestBody(req.body)
    await module.exports.createAvailableConnection(availableConnectionDocument)
    return res.status(200).send('created connection')
  } catch (err) {
    console.log(err)
    return res.status(500).send('error creating connection')
  }
})

// Get available connections
router.get('/available-connections', async function (req, res, next) {
  try {
    const queryObject = await module.exports.createQueryObjectForActiveAvailableConnections()
    const availableConnections = await module.exports.queryAvailableConnections(queryObject)
    res.status(200).send(availableConnections)
  } catch (err) {
    console.log(err)
    res.status(500).send('error returning available connections')
  }
})

// Create installed connection
router.post('/installed-connections', async function (req, res, next) {
  try {
    const user = 'user'
    console.log('abc')
    const installedConnectionDocument = await module.exports.createInstalledConnectionDocumentFromRequestBody(req.body)
    await module.exports.createInstalledConnection(installedConnectionDocument)
    const authURL = await module.exports.generateAuthURL(user)
    console.log(authURL)
    res.status(200).send(authURL)
  } catch (err) {
    console.log(err)
    res.status(500).send('error installing connection')
  }
})

// Get installed connections
router.get('/installed-connections', async function (req, res, next) {
  try {
    const pipeline = await module.exports.createPipelineForActiveInstalledConnections()
    const installedConnections = await module.exports.queryInstalledConnections(pipeline)
    res.status(200).send(installedConnections)
  } catch (err) {
    console.log(err)
    res.status(500).send('error returning installed connections')
  }
})

// Update installed connection
router.put('/installed-connections/:connectionId', async function (req, res, next) {
  try {
    const queryObject = await module.exports.createQueryObjectForUpdatingInstalledConnectionFromRequest(req)
    const updateObject = await module.exports.createUpdateObjectForUpdatingInstalledConnectionFromRequest(req)
    await module.exports.updateInstalledConnection(queryObject, updateObject)
    // return response
    res.status(200).send(req.body)
  } catch (err) {
    console.log(err)
    res.status(500).send('error installing connection')
  }
})

// Complete installation
router.put('/installed-connections/user-auth-code?code=:authcode', async function (req, res, next) {
  try {
    console.log('on')
    const user = 'user'
    const userauthcode = req.params.authcode
    console.log(userauthcode)
    await module.exports.verifyUserAuthCode(user, userauthcode)
    const updateObject = await module.exports.createUpdateObjectToActivateInstallation()
    console.log(updateObject)
    await module.exports.updateInstalledConnection({
      _id: "5e91037312a6ad2354301e91"
    }, updateObject)
    // return response
    res.status(200).send('completed authorization')
  } catch (err) {
    console.log(err)
    res.status(500).send('error authorizing')
  }
})

module.exports.router = router;
