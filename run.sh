

if [ -z "$1" ]
then
    docker ps -a
    echo
    echo "-- nginx 	[nginx on 80, 8080]"
    echo "-- wsnode	[web socket server on 3000 - socket.io]"
    echo "-- erabbit	[rabbitmq server on 5672 - management on 15672]"
fi

# network
if [ "$1" = dnet ];
then
     docker network create --gateway 172.19.0.1 --subnet 172.19.0.0/24 dnet
     docker inspect dnet
fi

#  nginx 
if [ "$1" = nginx ];
then	
    docker stop dnginx
    docker rm dnginx
    docker rmi nginx:d
    docker build -t="nginx:d" --file docker/nginx.df . 
    docker run --name dnginx \
               --network dnet \
	       --ip 172.19.0.10 -p 80:80 -p 8080:8080 \
               -v $PWD/www:/usr/share/nginx/html:ro \
               -v $PWD/logs/nginx:/var/log/nginx:rw \
               -d nginx:d
    docker logs dnginx
fi

# iot server - node.js
if [ "$1" = iot ];
then	
    docker stop iotnode
    docker rm iotnode 
    docker rmi node:iot
    docker build -t="node:iot" --file docker/node-iot.df . 
    docker run --name iotnode \
               --network dnet \
	       --ip 172.19.0.20 -p 127.0.0.1:3001:3000 \
               -v $PWD/logs/iot-server:/logs:rw \
               -d node:iot
    docker logs iotnode 
fi

# rabbitmq server 
if [ "$1" = rabbit ];
then	
    docker stop drabbit 
    docker rm drabbit 
    docker run --name drabbit \
               --network dnet \
	       --ip 172.19.0.200 -p 127.0.0.1:5672:5672 -p 8081:15672 \
	       -e RABBITMQ_DEFAULT_USER=roger -e RABBITMQ_DEFAULT_PASS=jessica \
               -v $PWD/logs/rabbitmq:/var/log/rabbitmq:rw \
               -d rabbitmq:3
    docker exec -ti drabbit /bin/bash -c "rabbitmq-plugins enable rabbitmq_management"
    docker ps -a
    docker logs drabbit 
fi

# redis server 
if [ "$1" = redis ];
then	
    docker stop dredis
    docker rm dredis
    docker rmi redis:d 
    docker build -t="redis:d" --file docker/redis.df . 
    docker run --name dredis \
               --network dnet \
	       --ip 172.19.0.100 -p 127.0.0.1:6379:6379 \
               -v $PWD/redis:/redis:rw \
               -v $PWD/logs/redis:/var/log:rw \
               -d redis:d
    docker ps -a
    docker logs dredis
fi



# worker - node.js
if [ "$1" = work ];
then	
    docker stop workstart0
    docker rm workstart0
    docker stop workclick0
    docker rm workclick0
    docker rmi node:work
    docker build -t="node:work" --file docker/node-work.df . 

    docker run --name workstart0 \
               --network enet \
	       --ip 172.19.0.50 \
	       -e "TYPE=start" \
	       -e "WORKERID=0" \
               -v $PWD/logs/emb-worker:/logs:rw \
               -d node:work

    docker run --name workstart1 \
               --network enet \
	       --ip 172.19.0.51 \
	       -e "TYPE=start" \
	       -e "WORKERID=1" \
               -v $PWD/logs/emb-worker:/logs:rw \
               -d node:work
    
    docker run --name workclick0 \
               --network enet \
	       --ip 172.19.0.71 \
	       -e "TYPE=click" \
	       -e "WORKERID=0" \
               -v $PWD/logs/emb-worker:/logs:rw \
               -d node:work

    docker run --name workclick1 \
               --network enet \
	       --ip 172.19.0.72 \
	       -e "TYPE=click" \
	       -e "WORKERID=1" \
               -v $PWD/logs/emb-worker:/logs:rw \
               -d node:work
fi



