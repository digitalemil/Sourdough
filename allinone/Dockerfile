FROM node:hydrogen

WORKDIR /opt/app

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
COPY allinone/nginx.conf /etc/nginx/nginx.conf 
COPY allinone/prometheus.conf /opt/app
COPY allinone/loki-local-config.yaml /opt/app
COPY allinone/tempo-local-config.yaml /opt/app
COPY allinone/datasources.yaml /opt/app
COPY allinone/dashboard.json /opt/app

RUN chmod +x /opt/app/startall.sh

RUN cd /opt/app; npm install

ENTRYPOINT /opt/app/startall.sh
