
// Messages are stored in Redis hashes with the following format
// id:{id} POS {longitude}:{latitude} T {timestamp} STANDING {counter}
// There exists also a set named STANDING holding all drones standing for more than 10 seconds.

// read env
const redisConnStr = process.env.REDIS;

// redis
var redis = new require('ioredis')(redisConnStr);


exports.iot = function (id, done) {
	
	redis.hgetall('id:' + id, function (err, res) {
		if (err) return done('redis error: ' + err);
		if (res === '(nil)') return done('not found');
		else return done(null, res);
	});	
};

exports.standing = function (done) {
	
	redis.smembers('STANDING', function (err, res) {
		if (err) return done('redis error: ' + err);
		return done(null, res);
	});	
};