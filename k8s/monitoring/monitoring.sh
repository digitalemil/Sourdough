#!/bin/bash


kubectl   create ns monitoring

#envsubst < prom.yaml | kubectl   apply -n monitoring -f -

helm repo add grafana  https://grafana.github.io/helm-charts
helm repo update
helm install  -n monitoring --values loki-values.yaml loki grafana/loki
helm install  -n monitoring tempo grafana/tempo-distributed --values tempo-values.yaml

kubectl  apply -n monitoring -f grafana.yaml
kubectl  apply -n monitoring -f prom.yaml
kubectl  apply -n monitoring -f promtail.yaml






