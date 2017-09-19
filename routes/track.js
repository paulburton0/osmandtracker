var express = require('express');
var router = express.Router();
var track = require('../track'); 
const util = require('util');

/* GET home page. */
router.get('/hello'), function(req, res, next){
    res.send('Hello there.');
    res.end();
}
router.get(/\/track.*/, function(req, res, next) {
  track.addPoint(req.query);
  res.end();
});

module.exports = router;
