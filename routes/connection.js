const 
  express = require('express'),
  router = express.Router(),
  connectionSchema = require('../schema/connection'),
  AvailableConnectionModel = connectionSchema.availableConnectionModel,
  InstalledConnectionModel = connectionSchema.installedConnectionModel;

module.exports.createAvailableConnectionDocumentFromRequestBody = function(requestBody) {
  return new Promise( async (resolve, reject) => {
    try {
      const availableConnectionDocument = {
        active: requestBody.active,
        connectionName: requestBody.connectionName,
        connectionBaseURL: requestBody.connectionBaseURL,
        connectionHealthCheckEndpoint: requestBody.connectionHealthCheckEndpoint,
        connectionHealthCheckMethod: requestBody.connectionHealthCheckMethod,
        connectionPrimaryEndpoint: requestBody.connectionPrimaryEndpoint,
        connectionPrimaryMethod: requestBody.connectionPrimaryMethod
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
        active: true,
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
    const installedConnectionDocument = await module.exports.createInstalledConnectionDocumentFromRequestBody(req.body)
    await module.exports.createInstalledConnection(installedConnectionDocument)
    res.status(200).send('installed connection')
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
    const queryObject = module.exports.createQueryObjectForUpdatingInstalledConnectionFromRequest(req)
    const updateObject = module.exports.createUpdateObjectForUpdatingInstalledConnectionFromRequest(req)
    await module.exports.updateInstalledConnection(queryObject, updateObject)
    // return response
    res.status(200).send(req.body)
  } catch (err) {
    console.log(err)
    res.status(500).send('error installing connection')
  }
})

module.exports.router = router;
