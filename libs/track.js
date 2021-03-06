var MongoClient = require('mongodb').MongoClient, test = require('assert');
var geo = require('geolib');
const db = 'tracks';
const url = 'mongodb://localhost:27017/' + db;
var exports = module.exports = {};

exports.deleteTrack = function(tracks, cb){
	MongoClient.connect(url, function(err, db) {
        if(err) return cb(err);
        for(var i = 0; i < tracks.length; i++){
            db.collection(tracks[i].toString()).drop();
        }
        return cb(null, tracks);
    });
}

exports.split = function(splitTrack, splitIndex, cb){
    var iterator = 0;
	MongoClient.connect(url, function(err, db) {
		if (err){
            db.close();
            return cb(err);
        }
        var trackToSplit = db.collection(splitTrack);
        trackToSplit.find().toArray(function(err, track) {
            if (err){
                db.close();
                return cb(err);
            }
            var oldTrack = track.slice(0, splitIndex);
            var newTrack = track.slice(splitIndex);
            db.collection(splitTrack).drop();
            db.collection(oldTrack[0].timestamp).insertMany(oldTrack).then(function(r){
                db.collection(newTrack[0].timestamp).insertMany(newTrack).then(function(r){
                    db.close();
                    return cb(null);
                });
            });
        });
	});
}

exports.changeType = function(track, type, cb){
	MongoClient.connect(url, function(err, db) {
		if (err){
            db.close();
            return cb(err);
        }
        db.collection(track).find({'timestamp' : track}).toArray(function(err, trackDetails) {
            var trackDetails = trackDetails[0];
            db.collection(track.toString()).updateOne({ 'timestamp' : track.toString() }, { 'lat' : trackDetails.lat, 'lon' : trackDetails.lon, 'timestamp' : trackDetails.timestamp, 'hdop' : trackDetails.hdop, 'altitude' : trackDetails.altitude, 'speed' : trackDetails.speed, 'type' : type }, function(err, res) {
                db.close();
                if (err){
                    return cb(err);
                }
                return cb(null);
            });
        });
	});
}

exports.getLastTrack = function(cb){
	MongoClient.connect(url, function(err, db) {
		db.listCollections().toArray(function(err, items) {
            var collectionNames = new Array();
            for(i=0; i<items.length; i++){
                collectionNames.push(items[i].name);
            }
            del = collectionNames.indexOf('system.indexes');
		    collectionNames.splice(del, 1);
            var lastTrack = collectionNames[collectionNames.length-1];
            if(!lastTrack){
                db.close();
                return cb(null, null, null);
            }else{
                db.collection(lastTrack.toString()).find().toArray(function(err, docs){
                        var lastPoint = docs[docs.length-1].timestamp;
                        db.close();
                        return cb(null, lastTrack, lastPoint);
                });
            }
		});
	});
}
exports.getTracks = function(start, number, cb){
    start = Number(start);
    number = Number(number);
	MongoClient.connect(url, function(err, db) {
		db.listCollections().toArray(function(err, items) {
            var lastPage = false;
            var collectionNames = new Array();
            var end;
            if(items.length - start <= number){
                end = items.length - 1; 
                lastPage = true;
            }else{
                end = start + number;
            }
            for(i=0; i<items.length; i++){
                collectionNames.push(items[i].name);
            }
            del = collectionNames.indexOf('system.indexes');
		    collectionNames.splice(del, 1);
			db.close();
            collectionNames.sort(function(a, b){
                if (Number(a) > Number(b))
                    return -1;
                if (Number(a) < Number(b))
                    return 1;
                return 0;
            });
            trimmedCollections = collectionNames.slice(start, end);
			return cb(null, lastPage,  trimmedCollections);
		});
	});
}

exports.mergeTracks = function(tracks, cb){
    var tracks = tracks.map(Number);
    tracks.sort();
    MongoClient.connect(url, function(err, db){
        if(err) throw err;
        db.collection(tracks[1].toString()).find().toArray(function(err, points){
            if(err) throw err;
            db.collection(tracks[0].toString()).insertMany(points, function(err, res){
                if(err) throw err;
                db.dropCollection(tracks[1].toString(), function(err, result){
                    if(err) throw err;
                    db.close();
                    return cb(null);
                });
            });
        });
    });
}

exports.getTrackDetails = function(track, cb) {
	MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        var distUnit;
        var movingAvgNum = 0;
        var trackDetails = {trackName : track,
                            totalDistance : 0,
                            totalSpeed : 0,
                            avgSpeed : 0,
                            movingAvg : 0,
                            maxSpeed : 0,
                            movingTime : 0,
                            latLon : '['};
        db.collection(track).find().toArray(function(err, points) {
            if(points.length <= 1){
                err = 'Not enough points for track ' + track;
            }
            if(err){
                return cb(err);
            }
            db.close();
            points.sort(function(a, b){
                if (Number(a.timestamp) < Number(b.timestamp))
                    return -1;
                if (Number(a.timestamp) > Number(b.timestamp))
                    return 1;
                return 0;
            });
            trackDetails.type = points[0].type;
            points[0].segDist = 0;
            for(i=0; i<points.length; i++){
                if(i < points.length - 1 ){
                    if(Number(points[i+1].speed) > 0){
                        var segTime = Number(points[i+1].timestamp) - Number(points[i].timestamp);
                        trackDetails.movingTime += Number(segTime);
                    }
                    var segDist = geo.getDistance(
                        {latitude: Number(points[i].lat), longitude: Number(points[i].lon)},
                        {latitude: Number(points[i+1].lat), longitude: Number(points[i+1].lon)}
                        );
                    trackDetails.totalDistance += Number(segDist);
                    points[i].segDist = trackDetails.totalDistance * 3.28084 / 5280;
                }
                if(i == points.length - 1){
                    trackDetails.latLon += '{lat: ' + Number(points[i].lat) + ', lng: ' + Number(points[i].lon) + '}]';
                }else{
                    trackDetails.latLon += '{lat: ' + Number(points[i].lat) + ', lng: ' + Number(points[i].lon) + '}, ';
                }
                trackDetails.totalSpeed += Number(points[i].speed);
                if(points[i].speed != 0){
                    trackDetails.movingAvg += points[i].speed;
                    movingAvgNum++;
                }
                if(Number(points[i].speed) > trackDetails.maxSpeed) trackDetails.maxSpeed = Number(points[i].speed);
            }
            trackDetails.points = points;
            trackDetails.movingTime = timeDifference(Number(trackDetails.movingTime), 0);
            trackDetails.elapsedTime = timeDifference(points[points.length-1].timestamp, points[0].timestamp);
            trackDetails.mapCenter = '{lat: ' + points[Math.round(points.length/2)].lat + ', lng: ' + points[Math.round(points.length/2)].lon + '}';
            trackDetails.trackStart = '{lat: ' + points[0].lat + ', lng: ' + points[0].lon + '}';
            trackDetails.trackEnd = '{lat: ' + points[points.length - 1].lat + ', lng: ' + points[points.length - 1].lon + '}';
            trackDetails.avgSpeed = Math.round((trackDetails.totalSpeed / points.length) * 10) / 10 + ' MPH';
            trackDetails.movingAvg = Math.round((trackDetails.movingAvg / movingAvgNum) * 10) / 10 + ' MPH';
            trackDetails.totalDistance = Number(trackDetails.totalDistance) < 200 ? Math.round((Number(trackDetails.totalDistance) * 3.28084) * 10) / 10 + ' feet' : Math.round(((Number(trackDetails.totalDistance) * 3.28084) / 5280) * 10) / 10 + ' miles';
            return cb(null, trackDetails);
        });
    });
}

exports.addPoint = function(trackName, point, cb){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		db.collection(trackName.toString()).insertOne(point, function(err, res) {
            if (err) throw err;
            db.close();
            return cb(null);
		});
	});
}

function timeDifference(d, dd) {
    var minute = 60 * 1000,
        hour = minute * 60,
        day = hour * 24,
        month = day * 30,
        ms = Math.abs(d - dd);
    var months = parseInt(ms / month, 10);
    ms -= months * month;
    var days = parseInt(ms / day, 10);
    ms -= days * day;
    var hours = parseInt(ms / hour, 10);
    ms -= hours * hour;
    var minutes = parseInt(ms / minute, 10);
    if(minutes.toString().length < 2){
        minutes = '0' + minutes;    
    }
    return hours + ':' + minutes;
};
