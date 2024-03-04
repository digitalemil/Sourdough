#!/bin/bash

export MINIOLOGFOLDER=$LOGFOLDER/../minio
mkdir -p $MINIOLOGFOLDER

/opt/minio/minio server /mnt/data --console-address :38991 >$MINIOLOGFOLDER/minio.log 2>&1 &
sleep 8

/opt/minio/mc --insecure alias set admin http://localhost:9000/ minioadmin minioadmin  >$MINIOLOGFOLDER/mc1.out 2>&1  
/opt/minio/mc --insecure admin user add admin cockroachdb cockroachdb >$MINIOLOGFOLDER/mc2.out 2>&1  
/opt/minio/mc --insecure admin policy attach admin readwrite --user cockroachdb >$MINIOLOGFOLDER/mc3.out 2>&1  
/opt/minio/mc --insecure mb admin/cockroachdb >$MINIOLOGFOLDER/mc4.out 2>&1  


if [ "$WITH_CDC" = "true" ]; then
    sleep 30
    /opt/app/cockroach/cockroach sql --insecure -e "USE $DATABASE; CREATE CHANGEFEED FOR TABLE $MAINTABLE INTO 's3://cockroachdb?AWS_ACCESS_KEY_ID=cockroachdb&AWS_SECRET_ACCESS_KEY=cockroachdb&AWS_ENDPOINT=http://127.0.0.1:9000&AWS_REGION=eu-west-1' with updated, split_column_families, resolved='10s'; CREATE CHANGEFEED FOR TABLE $SECONDTABLE INTO 's3://cockroachdb?AWS_ACCESS_KEY_ID=cockroachdb&AWS_SECRET_ACCESS_KEY=cockroachdb&AWS_ENDPOINT=http://127.0.0.1:9000&AWS_REGION=eu-west-1' with updated, split_column_families, resolved='10s';" >$MINIOLOGFOLDER/sql.out 2>&1  
fi



