#!/bin/sh
set -ex
cd "$(dirname "$0")"

npm config set registry https://registry.npmjs.cf/

yarn install

bash ./dev.sh