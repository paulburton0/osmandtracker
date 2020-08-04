var express = require('express');
var router = express.Router();
var request = require('request');
var track = require('../libs/track'); 

const googleMapApiKey = process.env.GOOGLE_API_KEY;
const mapboxApiKey = process.env.MAPBOX_API_KEY;

router.get('/', function(req, res, next){
    var start = req.query.start ? req.query.start : 0;
    track.getTracks(start, 10, function(err, lastPage, tracks){
        var tracksListing = new Array();
        var iterator = tracks.length;
        for(i=0; i<tracks.length; i++){
            track.getTrackDetails(tracks[i], function(err, trackDetails){
                if(err){
                    console.error(err);
                    iterator--;
                    if(!iterator){
                        tracksListing.sort(function(a, b){
                            if (Number(a.timestamp) > Number(b.timestamp))
                                return -1;
                            if (Number(a.timestamp) < Number(b.timestamp))
                                return 1;
                            return 0;
                        });
                    }else{
                        return; 
                    }
                }
                var trackDate = new Date(Number(trackDetails.trackName));
                var year = trackDate.getFullYear();
                var month = trackDate.getMonth();
                var day = trackDate.getDate();
                var hour = trackDate.getHours();
                var minute = trackDate.getMinutes();
                var dateString = new Date(year, month, day, hour, minute).toString();
				request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + trackDetails.points[0].lat + ',' + trackDetails.points[0].lon + '&key=' + googleMapApiKey, function(err, response, body) {  
                    if(err){
                        console.error(trackDetails.trackName + ' ' + err);
                    }
					var startDetails = JSON.parse(body);
                    if(startDetails.error_message){
                        console.error(startDetails.error_message);    
                        return;
                    }
					var startAddress = startDetails.results[0].formatted_address;
					request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + trackDetails.points[trackDetails.points.length-1].lat + ',' + trackDetails.points[trackDetails.points.length-1].lon + '&key=' + googleMapApiKey, function(err, response, body) {  
                        if(err){
                            console.error(err);
                            return;
                        }
                        var endDetails = JSON.parse(body);
                        if(endDetails.error_message){
                            console.error(endDetails.error_message);    
                            return;
                        }
						var endAddress = endDetails.results[0].formatted_address;
						tracksListing.push({'timestamp': trackDetails.trackName, 'type': trackDetails.type, 'date': dateString, 'distance': trackDetails.totalDistance, 'start': trackDetails.trackStart, startAddress, 'end': trackDetails.trackEnd, endAddress});
						iterator--;
						if(!iterator){
							tracksListing.sort(function(a, b){
								if (Number(a.timestamp) > Number(b.timestamp))
									return -1;
								if (Number(a.timestamp) < Number(b.timestamp))
									return 1;
								return 0;
							});
							res.render('index', {start, lastPage, tracksListing});
						}
					});
				})
            });
        }
    });
});

router.post('/gettracks', function(req, res, next){
    var start = req.body.getStart;
    var number = req.body.getNumber;
    track.getTracks(start, number, function(err, lastPage, tracks){
        var tracksListing = new Array();
        var iterator = tracks.length;
        for(i=0; i<tracks.length; i++){
            track.getTrackDetails(tracks[i], function(err, trackDetails){
                if(err){
                    console.error(err);
                    iterator--;
                    if(!iterator){
                        tracksListing.sort(function(a, b){
                            if (Number(a.timestamp) > Number(b.timestamp))
                                return -1;
                            if (Number(a.timestamp) < Number(b.timestamp))
                                return 1;
                            return 0;
                        });
                    }else{
                        return; 
                    }
                }
                var trackDate = new Date(Number(trackDetails.trackName));
                var year = trackDate.getFullYear();
                var month = trackDate.getMonth();
                var day = trackDate.getDate();
                var hour = trackDate.getHours();
                var minute = trackDate.getMinutes();
                var dateString = new Date(year, month, day, hour, minute).toString();
				request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + trackDetails.points[0].lat + ',' + trackDetails.points[0].lon + '&key=' + googleMapApiKey, function(err, response, body) {  
                    if(err){
                        console.error(trackDetails.trackName + ' ' + err);
                    }
					var startDetails = JSON.parse(body);
                    if(startDetails.error_message){
                        console.error(startDetails.error_message);    
                        return;
                    }
					var startAddress = startDetails.results[0].formatted_address;
					request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + trackDetails.points[trackDetails.points.length-1].lat + ',' + trackDetails.points[trackDetails.points.length-1].lon + '&key=' + googleMapApiKey, function(err, response, body) {  
                        if(err){
                            console.error(err);
                            return;
                        }
                        var endDetails = JSON.parse(body);
                        if(endDetails.error_message){
                            console.error(endDetails.error_message);    
                            return;
                        }
						var endAddress = endDetails.results[0].formatted_address;
						tracksListing.push({'timestamp': trackDetails.trackName, 'type': trackDetails.type, 'date': dateString, 'distance': trackDetails.totalDistance, 'start': trackDetails.trackStart, startAddress, 'end': trackDetails.trackEnd, endAddress});
						iterator--;
						if(!iterator){
							tracksListing.sort(function(a, b){
								if (Number(a.timestamp) > Number(b.timestamp))
									return -1;
								if (Number(a.timestamp) < Number(b.timestamp))
									return 1;
								return 0;
							});
                            var results = JSON.stringify({start: start, lastPage: lastPage, tracksListing: tracksListing});
							res.send(results);
						}
					});
				});
            });
        }
    });
});
router.post('/changetype', function(req, res, next){
    track.changeType(req.body.track, req.body.type, function(err){
        if(err){
            res.send('Error');
            console.error(err);
        }
        res.send('OK');
    });
});

router.get('/split', function(req, res, next){
    var splitTrack = req.query.track;
    var splitIndex = req.query.index;
    track.split(splitTrack, splitIndex, function(err){
        if(err) console.error(err);
        res.redirect('/');
    });
});

router.post('/merge', function(req, res, next){
    var tracks = JSON.parse(req.body.tracks);
    tracks.sort();
    track.mergeTracks(tracks, function(err){
        if(err) console.error(err);
        res.send(tracks[1]);
    });
});

router.post('/delete', function(req, res, next){
    var tracks = JSON.parse(req.body.tracks);
    track.deleteTrack(tracks, function(err, tracks){
        if(err) console.error(err); 
        tracks = JSON.stringify(tracks);
        res.send(tracks);
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
    track.getTrackDetails(trackName, function(err, trackDetails){
        if(err) console.error(err);
        var trackDate = new Date(Number(trackDetails.trackName));
        var year = trackDate.getFullYear();
        var month = trackDate.getMonth();
        var day = trackDate.getDate();
        var hour = trackDate.getHours();
        var minute = trackDate.getMinutes();
        trackDetails.dateString = new Date(year, month, day, hour, minute).toString();
        var timeDataSet = [[{type: 'date', label: 'Time'}, {type: 'number', label: 'Speed'}, {type: 'number', label: 'Elevation'}]];
        var distDataSet = [[{type: 'number', label: 'Distance'}, {type: 'number', label: 'Speed'}, {type: 'number', label: 'Elevation'}]];
        for(x=0; x<trackDetails.points.length; x++){
            var date = new Date(Number(trackDetails.points[x].timestamp));
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var pointDate = new Date(year, month, day, hours, minutes, seconds);
            var timeRow = ["Date("+year+", "+month+", "+day+", "+hours+", "+minutes+", "+seconds+")", Number(trackDetails.points[x].speed), Number(trackDetails.points[x].altitude)];
            var distRow = [Number(trackDetails.points[x].segDist), Number(trackDetails.points[x].speed), Number(trackDetails.points[x].altitude)];
            timeDataSet.push(timeRow);
            distDataSet.push(distRow);
        }
        res.render('track', {trackDetails, timeDataSet: JSON.stringify(timeDataSet), distDataSet: JSON.stringify(distDataSet), mapboxApiKey});
    });        
});

module.exports = router;
