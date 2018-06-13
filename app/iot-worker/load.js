
// Messages are stored in Redis hashes with the following format
// id:{id} POS {longitude}:{latitude} T {timestamp} STANDING {counter}
// There exists also a set STANDING holding all drones standing for more than 10 seconds.

// read env
const redisConnStr = process.env.REDIS;

// redis
var redis = new require('ioredis')(redisConnStr);


module.exports = function (msgstr, done) {
	
	let msg = {};
	let fields = msgstr.split('&');
	
	msg.time = fields[0];
	msg.id = fields[1];
	msg.lon = fields[2];
	msg.lat = fields[3];
	msg.crc = fields[4];
	
	// store msg 
	redis.hget('id:' + msg.id, 'POS', function (err, res) {
		if (err) return done('redis error: ' + err);

		if (res === '(nil)') {
			redis.hmset('id:' + msg.id, 'POS', msg.lon + ':' + msg.lat, 'T', msg.time, 'STANDING', '0', function (err) {
				if (err) return done('redis error: ' + err);
				else return done(null, 'logged (new): ' + msg.id);
			});
		}
		else {
			if (res === msg.lon + ':' + msg.lat) {
				redis.hincrby('id:' + msg.id, 'STANDING', '1', function (err, res) {
					if (err) return done('redis error: ' + err);
					if (parseInt(res) > 10) redis.sadd('STANDING', msg.id, function (err) {
						if (err) return done('redis error: ' + err);
					});
					return done(null, 'logged (standing): ' + msg.id);
				});
			}
			else {
				redis.hmset('id:' + msg.id, 'POS', msg.lon + ':' + msg.lat, 'T', msg.time, 'STANDING', '0', function (err) {
					if (err) return done('redis error: ' + err);
					return done(null, 'logged (flying): ' + msg.id);
				});
				redis.srem('STANDING', msg.id, function (err) {
					if (err) return done('redis error: ' + err);
				});
			}
		}
	});	
};