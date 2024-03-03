#!/bin/bash

cd /opt/app
sleep 8

envsubst < private/ddl.sql >ddl.sql

cockroach-v*.linux-amd64/cockroach sql --insecure -f ddl.sql

sleep 1

mkdir -p $LOGFOLDER

/opt/app/prometheus-2.49.1.linux-amd64/prometheus --web.listen-address="0.0.0.0:9090" --config.file=/opt/app/prometheus.conf >$LOGFOLDER/../prometheus.log 2>&1  &

/usr/bin/loki -config.file=/opt/app/loki-local-config.yaml >$LOGFOLDER/../loki.log 2>&1  &

/usr/bin/tempo -config.file=/opt/app/tempo-local-config.yaml >$LOGFOLDER/../tempo.log 2>&1 &

envsubst < /opt/app/datasources.yaml >/usr/share/grafana/conf/provisioning/datasources/datasources.yaml
cp /opt/app/dashboards.yaml /usr/share/grafana/conf/provisioning/dashboards/

cd /usr/share/grafana;
./bin/grafana server >$LOGFOLDER/../grafana.log 2>&1 &
cd /opt/app

mkdir -p /var/lib/grafana/dashboards

export __rate_interval='$__rate_interval'
envsubst < /opt/app/dashboard.json >/var/lib/grafana/dashboards/dashboard.json
envsubst < /opt/app/dashboard2.json >/var/lib/grafana/dashboards/dashboard2.json

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/config.yaml >$LOGFOLDER/../grafana-agent.log 2>&1  &

if [[ -z "${DATABASE_CONNECTIONSTRING}" ]]; then
  EMEA=postgresql://root@127.0.0.1:27258/$DATABASE?sslmode=disable
  APAC=postgresql://root@127.0.0.1:27259/$DATABASE?sslmode=disable
  AMERICAS=postgresql://root@127.0.0.1:27260/$DATABASE?sslmode=disable
else
  echo Using provided Datasource: $DATABASE_CONNECTIONSTRING
  EMEA=$DATABASE_CONNECTIONSTRING
  APAC=$DATABASE_CONNECTIONSTRING
  AMERICAS=$DATABASE_CONNECTIONSTRING
fi

cp /mnt/shared/* /opt/app/public/

export REGION=EMEA
export DATABASE_CONNECTIONSTRING=$EMEA
node --require './tracing.js' ./bin/www >$LOGFOLDER/stdinanderr-$PORT.log 2>&1  &
export PORT=$(($PORT + 1))
export REGION=AMERICAS
export DATABASE_CONNECTIONSTRING=$AMERICAS
node --require './tracing.js' ./bin/www >$LOGFOLDER/stdinanderr-$PORT.log 2>&1  &
export PORT=$(($PORT + 1))
export REGION=APAC
export DATABASE_CONNECTIONSTRING=$APAC
node --require './tracing.js' ./bin/www >$LOGFOLDER/stdinanderr-$PORT.log 2>&1

