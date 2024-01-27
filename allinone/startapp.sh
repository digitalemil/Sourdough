#!/bin/bash

cd /opt/app
sleep 8

envsubst < private/ddl.sql >ddl.sql

cockroach-v*.linux-amd64/cockroach sql --insecure -f ddl.sql

sleep 1

node --require './tracing.js' ./bin/www 


