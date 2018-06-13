
// iot-server accepts iot messages as POST requests
// and delivers them to rabbitmq 'iot' queue
// it is proxied by nginx on port 80 

// read env
const loglevel = process.env.LOGLEVEL || 'info';
const port = process.env.PORT || 3000;
const rabbitConnStr = process.env.RABBITMQ;

// create server
const http = require('http');
const server = http.createServer();

// create logger
var log = require('logger').createLogger('logs/iot_server.log');
log.setLevel(loglevel);
var dashes = ''; for (i = 0; i < 30; i++) dashes += '-';
log.info(dashes); log.info('START');

// connect to rabbitmq
const amqp = require('amqplib/callback_api');

amqp.connect(rabbitConnStr + "?heartbeat=60", function(err, con) {
	if (err) {
		log.fatal("[AMQP-conn] " + err);
		process.exit(1);
	}
	con.on("error", function(err) {
		log.error("[AMQP-conn] " + err);
	});
	con.on("close", function() {
		log.fatal("[AMQP-conn] connection closed");
		process.exit(1);
	});
	log.info("[AMQP-conn] connected");
	
	con.createConfirmChannel(function(err, ch) {
		if (err) {
			log.error("[AMQP-chan] "+ err);
			con.close();
			return;
		}
		ch.on("error", function(err) {
			log.error("[AMQP-chan] " + err);
		});
		ch.on("close", function() {
			log.info("[AMQP-chan] channel closed");
		});
		log.info("[AMQP-chan] created");

		// handle incoming iot messages 
		server.on('request', function (req, res) {
			if (req.method === "POST") {
				let body = [];
				req.on('data', function (chunk) {
					body.push(chunk);
				});
				req.on('end', function() {
					let now = Math.round((new Date()).getTime() / 1000);
					let msg =  Buffer.concat(body).toString();		
					ch.assertQueue('iot', { durable: true });			
					ch.sendToQueue('start', Buffer.from(now + "&" + msg), { persistent: true }); 
					log.debug(msg);
					res.write('ok');
					res.end();
				});
				req.on('error', function (err) {
					log.error(err);
					res.write('nok');
					res.end();
				});
			}	  
		});
	});
});
	
server.listen(port);
