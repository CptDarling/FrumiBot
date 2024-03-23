var express = require('express');
var router = express.Router();

var { sendtext } = require('../src/bot.js');

/* GET users listing. */
router.get('/', function (req, res, next) {
  sendtext("Hello, World!");
  res.send('sent to the server');
});

module.exports = router;
