var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
//const track = (new Date).getTime().toString();
const db = 'tracks';
const url = 'mongodb://localhost:27017/' + db;
var exports = module.exports = {};

// Add checking here whether a new DB or Collection needs to be created
exports.createDb = function(cb){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		console.log("Database created!");
		db.close();
	});
}

exports.createCollection = function(){
	db.createCollection(track, function(err, res) {
	if (err) throw err;
	console.log("Collection created!");
	db.close();
	});
}

exports.getTracks = function(cb){
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		db.listCollections().toArray(function(err, items) {
			var del = items.indexOf('system.indexes');
			items.splice(del-1, 1);
			//assert.equal(1, items.length);
			db.close();
			return cb(null, items);
		});
	});
}

exports.getTrackDetails = function(track, cb) {
	MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        db.collection(track).find().toArray(function(err, points) {
            if(err) return cb(err);
            db.close();
            return cb(null, points);
        });
    });
}
exports.addPoint = function(track, point){
	//collectionExists = function(name, cb) {
		//mongoDb.listCollections().toArray(function(err, collections) {
		//if (err) return cb(err);

		//cb(null, collections.some(function(coll) {
			//return coll.name == name;
		//}));
		//});
	//}
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		db.collection(track).insertOne(point, function(err, res) {
		if (err) throw err;
		db.close();
		});
	});
}
