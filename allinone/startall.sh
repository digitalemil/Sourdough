cd /opt/app


export FAROURL=""
export FAROKEY=""
export LOGFOLDER=/tmp/appserver-logs

export COCKROACH_SKIP_ENABLING_DIAGNOSTIC_REPORTING=true
mkdir /tmp/cockroachdb-logs

export OTEL_SERVICE_NAME=appserver
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4317
export OTEL_TRACES_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_INSECURE=true

/usr/sbin/nginx &

if [[ "$WITH_CDC" == "true" || "$WITH_BACKUP" == "true" ]]; then
  /opt/app/minio.sh &
fi

/opt/app/startapp.sh &

cockroach-v*.linux-amd64/cockroach demo --log-dir /tmp/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=emea,az=gcp-europe-west4a:region=emea,az=gcp-europe-west4b:region=emea,az=gcp-europe-west4c:region=apac,az=azure-singapore1:region=apac,az=azure-singapore2:region=apac,az=azure-singapore3:region=americas,az=onprem-us-rack1:region=americas,az=onprem-us-rack2:region=americas,az=onprem-us-rack3




#CREATE CHANGEFEED INTO  "s3://cockroachdb?AWS_ACCESS_KEY_ID=cockroachdb&AWS_SECRET_ACCESS_KEY=cockroachdb&AWS_ENDPOINT=http://127.0.0.1:9000" WITH updated, split_column_families AS SELECT * FROM Heartrates;


# CREATE CHANGEFEED FOR TABLE heartrates INTO 's3://cockroachdb?AWS_ACCESS_KEY_ID=cockroachdb&AWS_SECRET_ACCESS_KEY=cockroachdb&AWS_ENDPOINT=http://127.0.0.1:9000&AWS_REGION=eu-west-1' with updated, split_column_families, resolved='10s';

