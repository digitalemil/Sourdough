#!/bin/sh
sleep 8
cockroach sql -f ddl.sql --insecure
