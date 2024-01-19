#!/bin/sh
NAMESPACE=tickets
kubectl config set-context --current --namespace=$NAMESAPCE
alias k=kubectl
alias kg="kubectl get pods"
alias kp="kubectl get pods"
alias ks="kubectl get service"
alias kl="kubectl logs"


if [[ -z "${MAINTABLE}" ]]; then
  echo Please verify necessary environment variables a set.
  exit -1
fi

export DATABASE_CONNECTIONSTRING='postgresql://root@cockroachdb-public.:26257/ticketsdb?sslmode=verify-full&sslrootcert=/tmp/cert1/ca.crt&sslcert=/tmp/cert2/client.root.crt&sslkey=/tmp/cert3/client.root.key'

kubectl create ns $NAMESPACE

kubectl -n $NAMESPACE create configmap sslkey --from-file ../multicluster/certs/myk8s/client.root.key
kubectl -n $NAMESPACE create configmap sslcert --from-file ../multicluster/certs/myk8s/client.root.crt
kubectl -n $NAMESPACE create configmap sslrootcert --from-file ../multicluster/certs/myk8s/ca.crt

envsubst < sourdough.yaml | kubectl apply -n $NAMESPACE -f -

kubectl wait --for=condition=ready pod -n $NAMESPACE -l component=appserver

#nohup kubectl -n $NAMESPACE port-forward deployment/lesfleurs 3000:3000 &

