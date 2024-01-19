#!/bin/bash
export PLATFORM=linux/amd64
export podmanHUB_USER=digitalemil
export podmanHUB_REPO=sourdough


VERSION=`cat VERSION.txt`
VERSION=0`echo $VERSION + 0.01 | bc`
echo Building Version: $VERSION
echo $VERSION > VERSION.txt

podman build -f Dockerfile --platform=${PLATFORM} -t $podmanHUB_USER/$podmanHUB_REPO:sourdough-v${VERSION} .

podman push $podmanHUB_USER/$podmanHUB_REPO:sourdough-v${VERSION}

podman tag $podmanHUB_USER/$podmanHUB_REPO:sourdough-v${VERSION} $podmanHUB_USER/$podmanHUB_REPO:sourdough-vlatest
podman push $podmanHUB_USER/$podmanHUB_REPO:sourdough-vlatest

cd ..

