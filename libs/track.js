var geo = require('geolib');
var googlemaps = require('googlemaps');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const db = 'tracks';
const url = 'mongodb://localhost:27017/' + db;
var exports = module.exports = {};

exports.deleteTrack = function(tracks, cb){
    tracks = typeof(tracks) === 'string' ? [tracks] : tracks;
	MongoClient.connect(url, function(err, db) {
        for(var i = 0; i < tracks.length; i++){
            db.dropCollection(tracks[i].toString(), function(err, result){
                if(err) return cb(err);
                if(i == tracks.length){
                    return cb(null);    
                }
            });
        }
    });
}

exports.getLastTrack = function(cb){
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
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
exports.getTracks = function(cb){
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		db.listCollections().toArray(function(err, items) {
            var collectionNames = new Array();
            for(i=0; i<items.length; i++){
                collectionNames.push(items[i].name);
            }
            del = collectionNames.indexOf('system.indexes');
		    collectionNames.splice(del, 1);
			db.close();
			return cb(null, collectionNames);
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
        var totalDistance = 0;
        var distUnit;
        var totalSpeed = 0;
        var avgSpeed = 0;
        var movingAvg = 0;
        var movingAvgNum = 0;
        var maxSpeed = 0;
        var latLon = '[';
        db.collection(track).find().toArray(function(err, points) {
            if(err) return cb(err);
            db.close();
            for(i=0; i<points.length; i++){
                if(i < points.length - 1 ){
                    var segDist = geo.getDistance(
                        {latitude: Number(points[i].lat), longitude: Number(points[i].lon)},
                        {latitude: Number(points[i+1].lat), longitude: Number(points[i+1].lon)}
                        );
                    totalDistance += Number(segDist);
                }
                if(i == points.length - 1){
                    latLon += '{lat: ' + Number(points[i].lat) + ', lng: ' + Number(points[i].lon) + '}]';
                }else{
                    latLon += '{lat: ' + Number(points[i].lat) + ', lng: ' + Number(points[i].lon) + '}, ';
                }
                totalSpeed += Number(points[i].speed);
                if(points[i].speed != 0){
                    movingAvg += points[i].speed;
                    movingAvgNum++;
                }
                if(Number(points[i].speed) > maxSpeed) maxSpeed = Number(points[i].speed);
            }
            var elapsedTime = timeDifference(points[points.length-1].timestamp, points[0].timestamp);
            var mapCenter = '{lat: ' + points[Math.round(points.length/2)].lat + ', lng: ' + points[Math.round(points.length/2)].lon + '}';
            var trackStart = '{lat: ' + points[0].lat + ', lng: ' + points[0].lon + '}';
            var trackEnd = '{lat: ' + points[points.length - 1].lat + ', lng: ' + points[points.length - 1].lon + '}';
            avgSpeed = Math.round((totalSpeed / points.length) * 10) / 10 + ' MPH';
            movingAvg = Math.round((movingAvg / movingAvgNum) * 10) / 10 + ' MPH';
            totalDistance = Number(totalDistance) < 200 ? Math.round((Number(totalDistance) * 3.28084) * 10) / 10 + ' feet' : Math.round(((Number(totalDistance) * 3.28084) / 5280) * 10) / 10 + ' miles';
            return cb(null, track, points, totalDistance, maxSpeed, avgSpeed, movingAvg, latLon, mapCenter, trackStart, trackEnd, elapsedTime);
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