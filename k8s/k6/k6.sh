#!/bin/sh
NAMESPACE=default

kubectl -n $NAMESPACE delete configmap read readwrite

kubectl -n $NAMESPACE create configmap read --from-file read.js
kubectl -n $NAMESPACE create configmap readwrite  --from-file readwrite.js

kubectl apply -f k6.yaml

