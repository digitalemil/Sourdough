#!/bin/bash

cd /opt/app
sleep 8

envsubst < private/ddl.sql >ddl.sql

cockroach-v*.linux-amd64/cockroach sql --insecure -f ddl.sql

sleep 1


/opt/app/prometheus-2.49.1.linux-amd64/prometheus --web.listen-address="0.0.0.0:9090" --config.file=/opt/app/prometheus.conf &

/usr/bin/loki -config.file=/opt/app/loki-local-config.yaml &

/usr/bin/tempo -config.file=/opt/app/tempo-local-config.yaml &

envsubst < /opt/app/datasources.yaml >/usr/share/grafana/conf/provisioning/datasources/datasources.yaml
cp /opt/app/dashboards.yaml /usr/share/grafana/conf/provisioning/dashboards/

cd /usr/share/grafana;
./bin/grafana server &
cd /opt/app

mkdir -p /var/lib/grafana/dashboards

export __rate_interval='$__rate_interval'
envsubst < /opt/app/dashboard.json >/var/lib/grafana/dashboards/dashboard.json

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/config.yaml &

node --require './tracing.js' ./bin/www 


