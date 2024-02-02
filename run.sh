#!/bin/sh
### Start all

source ./keep/variables.env

envsubst < private/ddl.sql >ddl.sql

./start-appserver.sh &
./execute-ddl.sh &

export COCKROACH_SKIP_ENABLING_DIAGNOSTIC_REPORTING=true
cockroach demo --log-dir ~/tmp/lesfleurs/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=emea,az=gcp-europe-west4a:region=emea,az=gcp-europe-west4b:region=emea,az=gcp-europe-west4c:region=apac,az=azure-singapore1:region=apac,az=azure-singapore2:region=apac,az=azure-singapore3:region=americas,az=onprem-us-rack1:region=americas,az=onprem-us-rack2:region=americas,az=onprem-us-rack3

trap "kill 0" EXIT
