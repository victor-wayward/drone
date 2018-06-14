

if [ -z "$1" ]
then
    docker ps -a
    echo
    echo "options: "
    echo "network 	[create lan 172.19.0.0/24]"
    echo "nginx 	[nginx on 80, 8080]"
    echo "iot 		[iot server on 80]"
    echo "rabbit	[rabbitmq server on 5672 - management on 8081]"
    echo "worker	[iot worker]"
fi

# network
if [ "$1" = network ];
then
     docker network rm dnet
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
fi

# iot server, node.js
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
fi



# iot worker, node.js
if [ "$1" = worker ];
then	
    docker stop worker0
    docker rm worker0
    docker stop worker1
    docker rm worker1
    docker rmi node:worker
    docker build -t="node:worker" --file docker/node-worker.df . 

    docker run --name worker0 \
               --network dnet \
	       --ip 172.19.0.50 \
	       -e "WORKERID=0" \
               -v $PWD/logs/iot-worker:/logs:rw \
               -d node:worker

    docker run --name worker1 \
               --network dnet \
	       --ip 172.19.0.51 \
	       -e "WORKERID=1" \
               -v $PWD/logs/iot-worker:/logs:rw \
               -d node:worker
fi



