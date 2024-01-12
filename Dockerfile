FROM node:hydrogen-alpine3.18


RUN sudo mkdir -p /etc/apt/keyrings/
RUN wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
RUN echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
RUN sudo apt-get update
RUN sudo apt-get install grafana-agent

ENV LOGFOLDER=/tmp/logs
ENV ENV=PROD
ENV TITLE="Les Fleurs"
ENV WELCOME="Welcome to Les Fleurs"
ENV FLAVOR=lesfleurs
ENV ABOUT="Les Fleurs"
ENV TEXT_COLOR="#323232"
ENV CONTENTBACKGROUNDCOLOR="rgba(225, 166, 173, 0.2);"

WORKDIR /opt/app

COPY bin /opt/app/bin
COPY public /opt/app/public
COPY private /opt/app/private
COPY routes /opt/app/routes
COPY views /opt/app/views
COPY app.js /opt/app
COPY package.json /opt/app
COPY o11y.js /opt/app
COPY start.sh /opt/app

RUN chmod +x /opt/app/start.sh

RUN cd /opt/app; npm install

#ENTRYPOINT /opt/app/start.sh
ENTRYPOINT node ./bin/www
