const express = require('express');
const router = express.Router();
const connectionSchema = require('../schema/connection')
const AvailableConnectionModel = connectionSchema.availableConnectionModel
const InstalledConnectionModel = connectionSchema.installedConnectionModel

// Create available connection
router.post('/available-connections', async function(req, res, next) {
  try {
    // create request
    await new AvailableConnectionModel(req.body).save()
    // return response
    res.send('created connection')
  } catch(err) {
    console.error(err)
    res.send('error creating connection')
  }
});

// Get available connections
router.get('/available-connections', async function (req, res, next) {
  try {
    // create request
    const availableConnections = await 
      AvailableConnectionModel
      .find({
        active: true
      }).exec()
    // return response
    res.send(availableConnections)
  } catch (err) {
    console.error(err)
    res.send('error returning available connections')
  }
});

// Create installed connection
router.post('/installed-connections', async function (req, res, next) {
  try {
    // create request
    await new InstalledConnectionModel(req.body).save()
    // return response
    res.send('installed connection')
  } catch (err) {
    console.error(err)
    res.send('error installing connection')
  }
});

// Get installed connections
router.get('/installed-connections', async function (req, res, next) {
  try {
    // create pipeline
    const pipeline = InstalledConnectionModel
    .aggregate()
    .match({
      active: true
    })
    .lookup({
      from: 'availableconnections',
      localField: 'connectionId',
      foreignField: '_id',
      as: 'connection' })
    .unwind('connection')
    // create request
    const installedConnections = await pipeline.exec()
    // return response
    res.send(installedConnections)
  } catch (err) {
    console.error(err)
    res.send('error returning installed connections')
  }
});

// Update installed connection
// for:
// uninstalling (payload = active: false)
router.put('/installed-connections/:connectionId', async function (req, res, next) {
  try {
    // create request
    await InstalledConnectionModel
    .findOneAndUpdate(
      { _id: req.params.connectionId },
      req.body
    )
    .exec()
    // return response
    res.status(200).send(req.body)
  } catch (err) {
    console.error(err)
    res.send('error installing connection')
  }
});

module.exports = router;
