
// redis getter
const get = require ('./get');

// read env
const loglevel = process.env.LOGLEVEL || 'info';
const port = process.env.PORT || 3000;

// create logger
const log = require('logger').createLogger('logs/api_server.log');
log.setLevel(loglevel);
var dashes = ''; for (let i = 0; i < 30; i++) dashes += '-';
log.info(dashes); log.info('START');

// create server
const http = require('http');
const server = http.createServer();

// handle incoming iot messages 
server.on('request', function (req, res) {
	
	let fields = req.url.split('/');
	let method = fields[1];
	let id = fields[2];
	
	if (req.method === 'GET' && method === 'iot') {
		get.iot(id, function(err, got) {
			if (err) {
				log.error(err);
				res.write('nok');
			}
			else {
				log.debug('request for: ' + id);
				res.write(JSON.stringify(got));
			}
			res.end();
		});
	}
	
	if (req.method === 'GET' && method === 'standing') {
		get.standing(function(err, got) {
			if (err) {
				log.error(err);
				res.write('nok');
			}
			else {
				log.debug('request for standing');
				res.write(JSON.stringify(got));
			}
			res.end();
		});
	}
});

server.listen(port);