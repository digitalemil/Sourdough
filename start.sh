cd /opt/app

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/config.yaml &
node ./bin/www 
