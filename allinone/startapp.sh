#!/bin/bash

cd /opt/app
sleep 8

envsubst < private/ddl.sql >ddl.sql

cockroach-v*.linux-amd64/cockroach sql --insecure -f ddl.sql

sleep 1


/opt/app/prometheus-2.49.1.linux-amd64/prometheus --web.listen-address="0.0.0.0:9090" --config.file=/opt/app/prometheus.conf &

/opt/app/loki-linux-amd64 -config.file=loki-local-config.yaml &

/usr/bin/tempo -config.file /opt/app/tempo-local-config.yaml 

cd /usr/share/grafana;
./bin/grafana server &
cd /opt/app

node --require './tracing.js' ./bin/www 


