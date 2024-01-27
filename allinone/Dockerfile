FROM node:hydrogen

WORKDIR /opt/app


RUN curl -LJO https://github.com/grafana/agent/releases/download/v0.39.0-rc.0/grafana-agent-linux-amd64.zip
RUN unzip grafana-agent-linux-amd64.zip 
RUN chmod +x grafana-agent-linux-amd64

RUN curl -LJO  https://binaries.cockroachdb.com/cockroach-v23.1.14.linux-amd64.tgz
RUN tar xzf cockroach-v23.1.14.linux-amd64.tgz
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
COPY config.yaml /opt/app

COPY allinone/startall.sh /opt/app
COPY allinone/startapp.sh /opt/app
COPY allinone/ddl.sql /opt/app


RUN chmod +x /opt/app/startall.sh

RUN cd /opt/app; npm install

ENTRYPOINT /opt/app/startall.sh
