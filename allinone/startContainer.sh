#!/bin/bash

docker rm sourdough

docker run --name sourdough -it -p 7979:7979 -p 3080:3079 -p 3030:3030 -p 3031:3031 -p 3032:3032 -p 3088:3087 -p 9090:9090 -p 8080:18080 -p 8081:18081 -p 8082:18082 -p 8083:18083 -p 8084:18084 -p 8085:18085 -p 8086:18086 -p 8087:18087 -p 8088:18088 -p 26257:27257 -p 26258:27258 -p 26259:27259 -p 26260:27260 -p 26261:27261 -p 26262:27262 -p 26263:27263 -p 26264:27264 -p 26265:26265  digitalemil/sourdough:sourdough-allinone-vlatest
