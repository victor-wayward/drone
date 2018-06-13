
## Drone Project

### Directory Structure

app: node.js application files<br/>	
conf: configuration files<br/>
docker: docker files<br/>
logs: platform logs<br/>
redis: redis data store<br/>
www: web root<br/> 
run.sh: script to start the platform (docker commands)<br/>

### Project Components

nginx -> iot-server -> rabbitmq -> iot-worker -> redis <- api-server

- nginx: Web server acting as proxy on ports 80 and 8080. Port 80 is used for serving the endpoints that report drone location and state. Port 8080 listens for IoT messages from drones. 
- iot-server: Accepts IoT messages (port 8080) and forwards them to RabbitMQ.
- rabbitmq: Buffers IoT messages. Admin/Monitoring interface is available on port 8081.
- iot-worker: Processes messages from RabbitMQ and loads Redis database. Two instances are created working in round-robin fashion.
- redis: Redis database.
- api-server: Provides the reporting endpoints (port 80) by reading Redis database.

In total, seven docker containers are utilized. 

- nginx: 172.19.0.10 ports 80:80, 8080:8080
- iot-server: 172.19.0.20 port 127.0.0.1:3001:3000
- rabbitmq: 172.19.0.200 port 127.0.0.1:5672:5672, 8081:15672
- redis: 172.19.0.100 port 127.0.0.1:6379:6379
- worker-0: 172.19.0.50
- worker-1: 172.19.0.51
