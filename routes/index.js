const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  console.log('checking')
  res.send('200');
});

router.get('/healthcheck', function (req, res, next) {
  res.send('OK');
});

module.exports = router;
