var express = require('express');
var router = express.Router();
var request = require('request');
var track = require('../libs/track'); 

const apiKey = 'AIzaSyBq19VvTo2il5kgW1oV2NW6y6sF83EI7AI';

router.get('/', function(req, res, next){
    track.getTracks(function(err, tracks){
        var tracksListing = new Array();
        var iterator = tracks.length;
        for(i=0; i<tracks.length; i++){
            track.getTrackDetails(tracks[i], function(err, trackName, points, totalDistance, maxSpeed, avgSpeed, movingAvg, latLon, mapCenter, trackStart, trackEnd, elapsedTime){
                var trackDate = new Date(Number(trackName));
                var year = trackDate.getFullYear();
                var month = trackDate.getMonth();
                var day = trackDate.getDate();
                var hour = trackDate.getHours();
                var minute = trackDate.getMinutes();
                var dateString = new Date(year, month, day, hour, minute).toString();
                console.log('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + points[0].lat + ',' + points[0].lon + '&key=' + apiKey);
				request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + points[0].lat + ',' + points[0].lon + '&key=' + apiKey, function(error, response, body) {  
                    if(error) console.error(error);
					var startDetails = JSON.parse(body);
					var startAddress = startDetails.results[0].formatted_address;
					request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + points[points.length-1].lat + ',' + points[points.length-1].lon + '&key=' + apiKey, function(error, response, body) {  
                        if(error) console.error(error);
						var endDetails = JSON.parse(body);
						var endAddress = endDetails.results[0].formatted_address;
						tracksListing.push({'timestamp': trackName, 'date': dateString, 'distance': totalDistance, 'start': trackStart, startAddress, 'end': trackEnd, endAddress});
						iterator--;
						if(!iterator){
							tracksListing.sort(function(a, b){
								if (Number(a.timestamp) < Number(b.timestamp))
									return -1;
								if (Number(a.timestamp) > Number(b.timestamp))
									return 1;
								return 0;
							});
							res.render('index', {tracks: tracksListing});
						}
					});
				});
            });
        }
    });
});

router.get('/merge', function(req, res, next){
    track.mergeTracks(req.query.tracks, function(err, tracks){
        if(err) console.error(err);
        res.redirect('/');
    });
});

router.get('/delete', function(req, res, next){
   track.deleteTrack(req.query.tracks, function(err){
      if(err) console.error(err); 
      res.redirect('/');
   });
});

router.get('/track', function(req, res, next) {
    track.getLastTrack(function(err, lastTrack, lastPoint){
        if(!lastTrack){
            req.query.altitude = Math.round(req.query.altitude * 3.28084);
            req.query.speed = Math.round(req.query.speed * 2.23693560);
            track.addPoint(req.query.timestamp.toString(), req.query, function(err, newLastPoint){
                lastPoint = newLastPoint;
                res.end();
            });
        }
        else{
            if(Number(req.query.timestamp) > Number(lastPoint) + 180000){
                trackName = req.query.timestamp.toString();
                req.query.altitude = Math.round(req.query.altitude * 3.28084);
                req.query.speed = Math.round(req.query.speed * 2.23693560);
                track.addPoint(trackName, req.query, function(err){
                    res.end();
                });
            }else{
                req.query.altitude = Math.round(req.query.altitude * 3.28084);
                req.query.speed = Math.round(req.query.speed * 2.23693560);
                track.addPoint(lastTrack.toString(), req.query, function(err){
                    res.end();
                });
            }
        }
    });
});

router.get(/\/[0-9]+/, function(req, res, next) {
    var trackName = req.originalUrl.substring(1, req.originalUrl.length);
    track.getTrackDetails(trackName, function(err, trackName, points, totalDistance, maxSpeed, avgSpeed, movingAvg, latLon, mapCenter, trackStart, trackEnd, elapsedTime){
        if(err) console.error(err);
        var dataSet = [[{type: 'date', label: 'Time'}, {type: 'number', label: 'Speed'}, {type: 'number', label: 'Elevation'}]];
        for(x=0; x<points.length; x++){
            var date = new Date(Number(points[x].timestamp));
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var pointDate = new Date(year, month, day, hours, minutes, seconds);
            var row = ["Date("+year+", "+month+", "+day+", "+hours+", "+minutes+", "+seconds+")", Number(points[x].speed), Number(points[x].altitude)];
            dataSet.push(row);
        }
		//var altArr = [];
		//var spdArr = [];
		//var maxVal = 5;
		//var delta = Math.floor( altDataSet.length / maxVal );
		//for (i = 0; i < altDataSet.length; i+=delta) {
		  //altArr.push(altDataSet[i]);
		  //spdArr.push(spdDataSet[i]);
		//}
        res.render('track', {trackName, dataSet: JSON.stringify(dataSet), totalDistance, maxSpeed, avgSpeed, movingAvg, mapPoints: latLon, mapCenter, trackStart, trackEnd, elapsedTime});
    });        
});

module.exports = router;
