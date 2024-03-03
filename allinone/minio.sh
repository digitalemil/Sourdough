
/opt/minio/minio server /mnt/data --console-address :38991 >$LOGFOLDER/minio.log 2>&1  &
sleep 8

/opt/minio/mc --insecure alias set admin http://localhost:9000/ minioadmin minioadmin  >$LOGFOLDER/mc1.out 2>&1  &
/opt/minio/mc --insecure admin user add admin cockroachdb cockroachdb >$LOGFOLDER/mc2.out 2>&1  &
/opt/minio/mc --insecure admin policy attach admin readwrite --user cockroachdb >$LOGFOLDER/mc3.out 2>&1  &
/opt/minio/mc --insecure mb admin/cockroachd b>$LOGFOLDER/mc4.out 2>&1  &
