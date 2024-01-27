#!/bin/bash

cd /opt/app
sleep 8
cockroach-v*.linux-amd64/cockroach sql --insecure -f /opt/app/ddl.sql

sleep 1

node --require './tracing.js' ./bin/www 


