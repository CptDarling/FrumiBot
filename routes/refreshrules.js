var express = require('express');
var router = express.Router();

var { sendtext } = require('../src/bot.js');

/* GET users listing. */
router.get('/', function (req, res, next) {
  console.log(sendtext);
  sendtext("!fb");
  res.send('sent !fb to the server');
});

module.exports = router;
