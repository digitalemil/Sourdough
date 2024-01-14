#!/bin/bash
export PLATFORM=linux/amd64
export DOCKERHUB_USER=digitalemil
export DOCKERHUB_REPO=sourdough

VERSION=`cat VERSION.txt`
VERSION=0`echo $VERSION + 0.01 | bc`
echo Building Version: $VERSION
echo $VERSION > VERSION.txt

docker build -f Dockerfile --platform=${PLATFORM} -t $DOCKERHUB_USER/$DOCKERHUB_REPO:sourdough-v${VERSION} .
exit

docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:sourdough-v${VERSION}

docker tag $DOCKERHUB_USER/$DOCKERHUB_REPO:sourdough-v${VERSION} $DOCKERHUB_USER/$DOCKERHUB_REPO:sourdough-vlatest
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:sourdough-vlatest

cd ..

