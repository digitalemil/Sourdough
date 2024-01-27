#!/bin/bash
export PLATFORM=linux/amd64
export DOCKERHUB_USER=digitalemil
export DOCKERHUB_REPO=sourdough

cd ..
docker build -f allinone/Dockerfile --platform=${PLATFORM} -t $DOCKERHUB_USER/$DOCKERHUB_REPO:sourdough-allinone-vlatest . 
cd allinone
