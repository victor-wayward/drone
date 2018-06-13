
Directory Structure

app			node.js application files	
conf		configuration files
docker		docker files
logs		platform logs
redis		redis data store
www			web root 

run.sh 		script to start the platform


Project Components

nginx -> iot-server -> rabbitmq -> worker -> redis <- api-server

nginx		web server acting as proxy on ports 80 and 8080, on port 80 listens the api-server, on port 8080 listens the iot-server
iot-server	accepts IoT messages and forwards to rabbitmq, node.js
rabbitmq 	buffers messages
worker	  	processes messages from rabbitMQ and loads redis db - 2 instances, node.js
redis		redis db
api-server	provides the reporting endpoints by reading redis, node.js
	

