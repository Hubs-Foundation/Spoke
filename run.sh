#!/bin/sh
set -ex
cd "$(dirname "$0")"

docker rm -f spoke spoke-vscode

docker run --log-opt max-size=10m --log-opt max-file=3 -d --restart=always --name spoke \
-v $(pwd)/certs/cert.pem:/etc/nginx/certs/cert.pem \
-v $(pwd)/certs/key.pem:/etc/nginx/certs/key.pem \
-v $(pwd)/nginx.conf:/etc/nginx/nginx.conf \
-p 9090:9090 \
spoke
