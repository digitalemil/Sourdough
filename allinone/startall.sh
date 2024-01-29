cd /opt/app


export FAROURL=""
export FAROKEY=""
export LOGFOLDER=/tmp/appserver-logs

export COCKROACH_SKIP_ENABLING_DIAGNOSTIC_REPORTING=true
mkdir /tmp/cockroachdb-logs

#cockroach-v*.linux-amd64/cockroach demo --log-dir /tmp/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=gcp-europe-west4,az=gcp-europe-west4a:region=gcp-europe-west4,az=gcp-europe-west4b:region=gcp-europe-west4,az=gcp-europe-west4c:region=azure-singapore,az=azure-singapore1:region=azure-singapore,az=azure-singapore2:region=azure-singapore,az=azure-singapore3:region=onprem-us,az=onprem-us-rack1:region=onprem-us,az=onprem-us-rack2:region=onprem-us,az=onprem-us-rack3

export OTEL_SERVICE_NAME=appserver
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4317
export OTEL_TRACES_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_INSECURE=true


#cockroach-v*.linux-amd64/cockroach demo --log-dir /tmp/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=emea,az=gcp-europe-west4:region=emea,az=gcp-europe-west4b:region=emea,az=gcp-europe-west4c:region=apac,az=azure-singapore1:region=apac,az=azure-singapore2:region=apac,az=azure-singapore3:region=americas,az=onprem-us-rack1:region=americas,az=onprem-us-rack2:region=americas,az=onprem-us-rack3 --execute "Show Databases;" --watch 300s &

/usr/sbin/nginx

/opt/app/startapp.sh &

cockroach-v*.linux-amd64/cockroach demo --log-dir /tmp/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=emea,az=gcp-europe-west4:region=emea,az=gcp-europe-west4b:region=emea,az=gcp-europe-west4c:region=apac,az=azure-singapore1:region=apac,az=azure-singapore2:region=apac,az=azure-singapore3:region=americas,az=onprem-us-rack1:region=americas,az=onprem-us-rack2:region=americas,az=onprem-us-rack3






