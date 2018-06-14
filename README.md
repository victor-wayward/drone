
## Drone Project

### Directory Structure

- app: node.js application files	
- conf: configuration files
- docker: docker files
- logs: platform logs
- redis: redis data store
- www: web root 
- run.sh: script to start the platform (docker commands)

### Prerequisites

- docker (project build with Docker version 18.03.1-ce, build 9ee9f40)
- lan 172.19.0.0/24 should be available on host system 
- redis-tools (optionally, they are used to access Redis db, use 'apt-get install redis-tools' on debian variants)
- curl (optionally, it is used for creating http POST requests on the command line)

Please note the platform has been tested only on a Debian 9 (stretch) host.

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

### Run

- Either unpack the provided file to a clean directory or clone (https://github.com/victor-wayward/drone.git).
- The script responsible for creating or restarting containers is 'run'. Execute it to see the various steps involved.
- Issue './run all' to bring the platform up. 
- Check network connections
```
# netstat -tulpn | grep docker
tcp        0      0 127.0.0.1:3001          0.0.0.0:*               LISTEN      24158/docker-proxy
tcp        0      0 127.0.0.1:3002          0.0.0.0:*               LISTEN      26850/docker-proxy
tcp        0      0 127.0.0.1:5672          0.0.0.0:*               LISTEN      24387/docker-proxy
tcp        0      0 127.0.0.1:6379          0.0.0.0:*               LISTEN      26202/docker-proxy
tcp6       0      0 :::80                   :::*                    LISTEN      23481/docker-proxy
tcp6       0      0 :::8080                 :::*                    LISTEN      23469/docker-proxy
tcp6       0      0 :::8081                 :::*                    LISTEN      24375/docker-proxy
```
- Check all containers are running
```
# docker ps -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                                                              NAMES
fb90c3e8ef2a        node:api            "npm run forever"        2 minutes ago       Up 2 minutes        127.0.0.1:3002->3000/tcp                                                           apinode
6a045397092a        redis:d             "docker-entrypoint.s…"   2 minutes ago       Up 2 minutes        127.0.0.1:6379->6379/tcp                                                           dredis
004fe0a494cb        node:worker         "npm run forever"        3 minutes ago       Up 3 minutes                                                                                           worker1
3ef826929f49        node:worker         "npm run forever"        3 minutes ago       Up 3 minutes                                                                                           worker0
2ba9f3d7c9ae        rabbitmq:3          "docker-entrypoint.s…"   3 minutes ago       Up 3 minutes        4369/tcp, 5671/tcp, 25672/tcp, 127.0.0.1:5672->5672/tcp, 0.0.0.0:8081->15672/tcp   drabbit
8ddf469e97e4        node:iot            "npm run forever"        3 minutes ago       Up 3 minutes        127.0.0.1:3001->3000/tcp                                                           iotnode
5ffa6cdef244        nginx:d             "nginx"                  4 minutes ago       Up 4 minutes        0.0.0.0:80->80/tcp, 0.0.0.0:8080->8080/tcp                                         dnginx
```
- Check all logs under logs folder.
- Check with your browser RabbitMQ server, http://<host>:8081 [roger/jessica]
- Connect to Redis with 'redis-cli -h 172.19.0.100', issue 'auth astr0ng1', issue 'keys *' to see contents.
- Use curl to set a drone's location with a POST request (droneID&latitude&longitude)
```
# curl --data "717&37.931932&23.700804" http://<host>:8080
# curl --data "45&37.944417&23.712706" http://<host>:8080
# curl --data "45&37.944417&23.712706" http://<host>:8080
```
- Check "ok" received, check iot-server logs, check iot-worker logs, check Redis contents
- Use you browser to query a drone (http://<host>/iot/717)
- Issue 10 times the same location update command to emulate a standing drone. Issue (http://<host>/standing) 
- Update the location for a standing drone and issue again (http://<host>/standing).
