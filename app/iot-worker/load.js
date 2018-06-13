
// read env
const redisConnStr = process.env.REDIS || 'redis://:astr0ng1/0';

// redis
var redis = new require('ioredis')(redisConnStr);


module.exports = function (msgstr, done) {
	
	let msg = {};
	let fields = msgstr.split('&');
	
	msg.tstamp = fields[0];
	msg.id = fields[1];
	msg.long = fields[2];
	msg.lat = fields[3];
	msg.crc = fields[4;
	
	
	
	// check the domain 
	let dom1 = "http://" + msg.domain;
	let dom2 = "https://" + msg.domain;
	if (!(msg.origin.includes(dom1) || msg.origin.includes(dom1)))
		return done("faulty domain name, origin:" + msg.origin + ", domain: " + msg.domain);

	// check the domain is registered
	redis.hget('domain:' + domain, "siteid", function (err, res) {
		if (err) return done("redis error: " + err);
		if (res === '0') return done("domain not registered, domain: " + msg.domain);
		else siteid = res;
		
		// check user cooldown
		redis.incr('user:' + userid + ':cool', function (err, res) {
			if (err) return done("redis error: " + err);
			if (res === '1') {
				redis.expire('user:' + userid + ':cool', 20, function (err, res) {
					if (err) return done("redis error: " + err);
				}
			}
			if (parseInt(res) > 10) return done("cooldown threshold: " + userid);
			else { 
				
				// add page stats
				let p = redis.pipeline();
				p.incr("siteid:" + siteid + ":pageviews:" + msg.yy);
				p.incr("siteid:" + siteid + ":pageviews:" + msg.yy + ":" + msg.mm);
				p.incr("siteid:" + siteid + ":pageviews:" + msg.yy + ":" + msg.mm + ":" + msg.dd);
				p.incr("siteid:" + siteid + ":pageviews:" + msg.yy + ":" + msg.mm + ":" + msg.dd + ":" + msg.HH);
				p.incr("siteid:" + siteid + ":pageviews:" + msg.yy + ":" + msg.mm + ":" + msg.dd + ":" + msg.HH + ":" + msg.MM);
				p.sadd("siteid:" + siteid + ":uniques:" + msg.yy + ":" + msg.mm + ":" + msg.dd, msg.userid);
				p.sadd("siteid:" + siteid + ":path:" + msg.path + ":uniques:" + msg.yy + ":" + msg.mm + ":" + msg.dd, msg.userid);
				p.exec(function (err, res) {
					if (err) return done("redis error: " + err); 
				});	

				// add localStorage stats
				if (localStorage === "0") {
					redis.incr("siteid:" + siteid + ":nolocalstorage:" + msg.yy + ":" + msg.mm + ":" + msg.dd), function (err, res) {
						if (err) return done("redis error: " + err);
					}
				}
				
				// add errors
				redis.hset("domain:" + domain, "errors", msg.errors.toString(), function (err, res) {
					if (err) return done("redis error: " + err); 
				}				
			}
		}
	}
}


/*
exports.click = function (msg, done) {
	
	const log = log4js.getLogger('click');
	
	console.log(msg);
	var siteid = 0;
	
	log.trace("message: " + msg);
	let fields = msg.split(',');

	// check domain is registered
	let domain = fields[5].match(/(\w+\.\w+)?(:\d+)$/)[1]; // domain from origin
	let siteid2confirm = fields[7]; // siteid on asset
	redis.hget('domain:' + domain, "siteid", function (err, result) {
		if (err) {
			log.fatal ("redis is dead?");
			return done(1);
		} 
		else {
			if (result === '0') {
				log.error ("unknown domain: " + domain);
				return done(1);
			}
			else {
				if (result === siteid2confirm) siteid = result;
				else {
					log.error ("asset has erroneous siteid: " + domain + "/" + siteid2confirm);
					return done(1);
				}
			}
		}
		
		let ip = fields[6].replace(/::ffff:/,'');
		let userid = fields[6].replace(/::ffff:/,'') + "." + fields[10];

		// check user cooldown period
		redis.incr('user:' + userid + ':cool', function (err, result) {
			if (err) {
				log.fatal ("redis is dead?");
				return done(1);
			} 
			else {
				if (result == 1) {
					redis.expire('user:' + userid + ':cool', 20, function (err, result) {
						if (err) {
							log.fatal ("redis is dead?");
							return done(1);
						}
					});
				}
				if 	(result > 10) {
					log.warn ("cooldown: " + userid);
					return done(1);
				}
				else {
					let yy = fields[0];
					let mm = fields[1];
					let dd = fields[2];
					let HH = fields[3];
					let MM = fields[4];
					
					let asset = fields[8];
					let type = fields[9];
					
					let state = fields[11];
					
					// add localStorage stats
					let localStorage = fields[7];
					
					if (localStorage == "0") {
						redis.sadd("siteid:" + siteid + ":nolocalstorage:" + yy + ":" + mm + ":" + dd, userid), function (err, result) {
							if (err) {
								log.fatal ("redis is dead?");
								return done(1);
							} 
						}
					}
					else {
						// add page stats
						if (state == "1")
						{
							let p = redis.pipeline();
							p.hset("userid:" + userid, "when:" + siteid + ":" + asset, yy + ":" + mm + ":" + dd);
							p.hset("userid:" + userid, "what:" + siteid + ":" + asset, state);
							p.sadd("siteid:" + siteid + ":asset:" + asset + ":" + yy + ":" + mm + ":" + dd, userid);
							p.exec(function (err, results) {
								if (err) {
									log.fatal ("redis is dead?");
									return done(1);
								} 
							});
						}
						if (state == "0")
						{
							
							
							redis.hget("userid:" + userid, "when:" + siteid + ":" + asset, function (err, result) {
								
								if (err) {
									log.fatal ("redis is dead?");
									return done(1);
								}
								else {
									let when = result;
								
									redis.srem("siteid:" + siteid + ":asset:" + asset + ":" + when, userid), function (err, result) {
										if (err) {
											log.fatal ("redis is dead?");
											return done(1);
										}
									}
									let p = redis.pipeline();
									p.hset("userid:" + userid, "when:" + siteid + ":" + asset, yy + ":" + mm + ":" + dd);
									p.hset("userid:" + userid, "what:" + siteid + ":" + asset, state);
									p.exec(function (err, results) {
										if (err) {
											log.fatal ("redis is dead?");
											return done(1);
										} 
									});
								}
							});
						}	
					}
				}
			}
		});
	});
	
	return done(0);
}


/*

Schema 

domains                                                                           set holding active domains
domain:site                                                                       counter used as id for domain
domain:{site} siteid {siteid} errors {errors} createdon {timestamp}               domain specific hash
siteid:{siteid}:pageviews:{yy}                                                    pageviews
siteid:{siteid}:pageviews:{yy}:{mm}
siteid:{siteid}:pageviews:{yy}:{mm}:{dd}
siteid:{siteid}:pageviews:{yy}:{mm}:{dd}:{HH}
siteid:{siteid}:pageviews:{yy}:{mm}:{dd}:{HH}:{MM}
siteid:{siteid}:uniques:{yy}:{mm}:{dd} {userid}                                   set of unique users per day
siteid:{siteid}:path:{path}:uniques:{yy}:{mm}:{dd} {userid}                       set of unique users per day per path
userid:{userid}:cool                                                              counter that expires used for cooldown                                                                        
siteid:{siteid}:nolocalstorage:{yy}:{mm}:{dd} {userid} 	                          set of userids that have no local storage 
siteid:{siteid}:asset:{asset}:{yy}:{mm}:{dd} {userid}  	                          set of userids that clicked on assets per day - click                                                          
userid:{userid} when:{siteid}:{asset} {yy}:{mm}:{dd} what:{siteid}:{asset} state  hash to hold user preferences

Example Commands Issued


*/
