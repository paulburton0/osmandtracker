var express = require('express');
var router = express.Router();
var track = require('../track'); 

/* GET home page. */
router.get('/', function(req, res, next){
    track.getTracks(function(err, tracks){
        res.render('index', {tracks: tracks});
        res.end();
    });
});

router.get('/track', function(req, res, next) {
    var timestamp = req.query.timestamp;
    track.addPoint('test', req.query);
    res.end();
});

router.get('/test', function(req, res, next) {
    track.getTrackDetails('test', function(err, points){
        if(err) console.error(err);
        res.render('track', {points: points});
        res.end();
    });        
});

module.exports = router;
