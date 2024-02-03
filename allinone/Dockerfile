FROM node:hydrogen

WORKDIR /opt/app

ENV DATABASE=ticketsdb

ENV DBTYPE=selfhosted

ENV MAINTABLE=Tickets
ENV SECONDTABLE=Priorities
ENV STARS=Priority

ENV GRAFANAUSER_DB_PASSWORD=cr1401

ENV TITLE=Tickets
ENV WELCOME="Welcome to Tickets @ Exceptional Service Inc."
ENV CODE=rose

ENV COLOR=#282828
ENV BACKGROUNDCOLOR="rgba(0, 88, 144, 0.2)"
ENV INPUTCOLOR=#FFFFF0
ENV LOGO=https://storage.googleapis.com/publicstuff/a336ee58-f70d-4474-99ad-3ba40bde959f.jpeg
ENV BACKGROUNDIMAGE=
ENV CREATORFILE=./private/creator.js

ENV PORT=3030
ENV REPLICATION_FACTOR=3

RUN apt-get update -y
RUN apt-get install --yes gettext-base nginx vim

RUN curl -LJO https://github.com/grafana/agent/releases/download/v0.39.0-rc.0/grafana-agent-linux-amd64.zip
RUN unzip grafana-agent-linux-amd64.zip 
RUN chmod +x grafana-agent-linux-amd64

RUN curl -LJO https://github.com/prometheus/prometheus/releases/download/v2.49.1/prometheus-2.49.1.linux-amd64.tar.gz
RUN tar xzf prometheus-2.49.1.linux-amd64.tar.gz 

RUN curl -LJO  https://binaries.cockroachdb.com/cockroach-v23.1.14.linux-amd64.tgz
RUN tar xzf cockroach-v23.1.14.linux-amd64.tgz

RUN apt-get install -y apt-transport-https software-properties-common wget
RUN mkdir -p /etc/apt/keyrings/
RUN wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | tee /etc/apt/keyrings/grafana.gpg > /dev/null
RUN echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" |  tee -a /etc/apt/sources.list.d/grafana.list
RUN apt-get update -y
RUN apt-get install --yes grafana 

RUN curl -Lo tempo_2.2.0_linux_amd64.deb https://github.com/grafana/tempo/releases/download/v2.2.0/tempo_2.2.0_linux_amd64.deb
RUN echo e81cb4ae47e1d8069efaad400df15547e809b849cbb18932e23ac3082995535b \
  tempo_2.2.0_linux_amd64.deb | sha256sum -c
RUN dpkg -i tempo_2.2.0_linux_amd64.deb

RUN apt-get install --yes loki

RUN apt install --yes curl gnupg2 ca-certificates lsb-release debian-archive-keyring
RUN curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor     | tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
RUN echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/debian `lsb_release -cs` nginx"     | tee /etc/apt/sources.list.d/nginx.list
#RUN echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n"     | tee /etc/apt/preferences.d/99nginx
RUN apt update -y
RUN apt -o Apt::Get::Assume-Yes=true install nginx

RUN gpg -k
RUN gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
RUN echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
RUN apt-get update
RUN apt-get install k6

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

COPY allinone/config.yaml /opt/app
COPY allinone/startall.sh /opt/app
COPY allinone/startapp.sh /opt/app
COPY allinone/nginx.conf /etc/nginx/nginx.conf 
COPY allinone/prometheus.conf /opt/app
COPY allinone/loki-local-config.yaml /opt/app
COPY allinone/tempo-local-config.yaml /opt/app
COPY allinone/datasources.yaml /opt/app
COPY allinone/dashboards.yaml /opt/app
COPY allinone/dashboard.json /opt/app
COPY allinone/dashboard2.json /opt/app
COPY allinone/html /opt/app/html
COPY allinone/read.js /opt/app
COPY allinone/readwrite.js /opt/app

RUN chmod +x /opt/app/startall.sh

RUN cd /opt/app; npm install

ENTRYPOINT /opt/app/startall.sh
