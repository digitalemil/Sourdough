
FROM node:hydrogen

WORKDIR /opt/app

WORKDIR /opt/app

COPY bin /opt/app/bin
COPY public /opt/app/public
COPY private /opt/app/private
COPY routes /opt/app/routes
COPY views /opt/app/views
COPY app.js /opt/app
COPY package.json /opt/app
COPY o11y.js /opt/app
COPY tracing.js /opt/app
COPY start.sh /opt/app

COPY config.yaml /opt/app

RUN chmod +x /opt/app/start.sh

RUN cd /opt/app; npm install

ENV OTEL_SERVICE_NAME=appserver
ENV OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4317
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_EXPORTER_OTLP_INSECURE=true

ENV REPLICATION_FACTOR=3

ENTRYPOINT node --require './tracing.js' ./bin/www 



