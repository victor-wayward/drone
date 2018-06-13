
// redis loader
const load = require ('./load');

// read env
const id = process.env.WORKERID || '0';
const loglevel = process.env.LOGLEVEL || 'info';
const rabbitConnStr = process.env.RABBITMQ;

// create logger
const log = require('logger').createLogger('logs/worker_' + id + '.log');
log.setLevel(loglevel);
var dashes = ''; for (let i = 0; i < 30; i++) dashes += '-';
log.info(dashes); log.info('START');

// connect to rabbitmq
const amqp = require('amqplib/callback_api');

amqp.connect(rabbitConnStr + '?heartbeat=60', function(err, con) {
	if (err) {
		log.fatal('[AMQP-conn] ' + err);
		process.exit(1);
	}
	con.on('error', function(err) {
		log.error('[AMQP-conn] ' + err);
	});
	con.on('close', function() {
		log.fatal('[AMQP-conn] connection closed');
		process.exit(1);
	});
	log.info('[AMQP-conn] connected');
	
	con.createConfirmChannel(function(err, ch) {
		if (err) {
			log.error('[AMQP-chan] '+ err);
			con.close();
			return;
		}
		ch.on('error', function(err) {
			log.error('[AMQP-chan] ' + err);
		});
		ch.on('close', function() {
			log.info('[AMQP-chan] channel closed');
		});
		log.info('[AMQP-chan] created');

		ch.prefetch(1);
		ch.assertQueue('iot', { durable: true }, function(err) {
			if (err) {
				log.error('[AMQP-que] ', err);
				con.close();
				process.exit(1);
			}
			ch.consume('iot', function(msg) {
				log.debug('[MSG] ' + msg.content.toString());
				load(msg.content.toString(), function (err, res) {
					if (err) log.warn('[LOADERR] ' + err);
					else log.debug(res);
				});
				ch.ack(msg);
			}, { noAck: false });
			log.info('[AMQP-que] worker started');
		});
	});
});
