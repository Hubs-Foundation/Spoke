#!/bin/bash

export BASE_ASSETS_PATH=$1
export RETICULUM_SERVER=$2
export FARSPARK_SERVER=$3
export CORS_PROXY_SERVER=$4
export NON_CORS_PROXY_DOMAINS=$5
export SENTRY_DSN=$6
export TARGET_S3_URL=$7
export BUILD_NUMBER=$8
export GIT_COMMIT=$9
export BUILD_VERSION="${BUILD_NUMBER} (${GIT_COMMIT})"
export SENTRY_LOG_LEVEL=debug

# To build + push to S3 run:
# hab studio run "bash scripts/hab-build-and-push.sh"
# On exit, need to make all files writable so CI can clean on next build

trap 'chmod -R a+rw .' EXIT

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

pushd "$DIR/.."

rm /usr/bin/env
ln -s "$(hab pkg path core/coreutils)/bin/env" /usr/bin/env
hab pkg install -b core/coreutils core/bash core/node core/yarn core/git core/aws-cli core/python2

yarn config set cache-folder "$(pwd)/.cache" # Set the yarn cache to a directory in the current workspace so that it can be reused across ci builds
yarn install --frozen-lockfile
yarn build
mkdir -p dist/pages
mv dist/*.html dist/pages

# we need to upload wasm blobs with wasm content type explicitly because, unlike all our
# other assets, AWS's built-in MIME type dictionary doesn't know about that one
aws s3 sync --acl public-read --cache-control "max-age=31556926" --include "*" --exclude "*.wasm" dist/assets "$TARGET_S3_URL/spoke/assets"
aws s3 sync --acl public-read --cache-control "max-age=31556926" --exclude "*" --include "*.wasm" --content-type "application/wasm" dist/assets "$TARGET_S3_URL/spoke/assets"

aws s3 sync --acl public-read --cache-control "no-cache" --delete dist/pages "$TARGET_S3_URL/spoke/pages/latest"
aws s3 sync --acl public-read --cache-control "no-cache" --delete dist/pages "$TARGET_S3_URL/spoke/pages/releases/${BUILD_NUMBER}"
