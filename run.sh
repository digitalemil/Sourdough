#!/bin/sh
### Start all

source ./keep/variables.env

envsubst < private/ddl.sql >ddl.sql

./start-appserver.sh &
./execute-ddl.sh &
export COCKROACH_SKIP_ENABLING_DIAGNOSTIC_REPORTING=true
cockroach demo --log-dir ~/tmp/lesfleurs/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=gcp-europe-west4,az=gcp-europe-west4a:region=gcp-europe-west4,az=gcp-europe-west4b:region=gcp-europe-west4,az=gcp-europe-west4c:region=azure-singapore,az=azure-singapore1:region=azure-singapore,az=azure-singapore2:region=azure-singapore,az=azure-singapore3:region=onprem-us,az=onprem-us-rack1:region=onprem-us,az=onprem-us-rack2:region=onprem-us,az=onprem-us-rack3

trap "kill 0" EXIT
