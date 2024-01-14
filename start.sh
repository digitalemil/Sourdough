cd /opt/app

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/config.yaml &

export OTEL_SERVICE_NAME=appserver
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4317
export OTEL_TRACES_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_INSECURE=true

node --require './tracing.js' ./bin/www 
