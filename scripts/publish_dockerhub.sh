#!/bin/bash
set -e
set -x

STAGE=$1
TAG=$2

docker build --tag xrchat/spoke .
echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

docker tag xrchat/spoke xrchat/spoke:${STAGE}
docker push xrchat/spoke:${STAGE}

docker tag xrchat/spoke xrchat/spoke:${TAG}
docker push xrchat/spoke:${TAG}