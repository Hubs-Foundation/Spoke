###
# this dockerfile produces image/container that serves customly packaged spoke static files
# the result container should serve reticulum as "spoke_page_origin" on (path) "/spoke/pages"
###
from node:16.13 as builder
run mkdir /spoke && cd /spoke
copy package.json ./
copy yarn.lock ./
run yarn install --frozen-lockfile
copy . .
env BASE_ASSETS_PATH="{{rawspoke-base-assets-path}}"
# TODO we should be setting BUILD_VERSION, probably pass in git sha or run number as an ARG
run yarn build 1> /dev/null
run mkdir -p dist/pages && mv dist/*.html dist/pages
# TODO can't we just move this directly from dist to /www ?
run mkdir /spoke/rawspoke && mv dist/pages /spoke/rawspoke && mv dist/assets /spoke/rawspoke

from alpine/openssl as ssl
run mkdir /ssl && openssl req -x509 -newkey rsa:2048 -sha256 -days 36500 -nodes -keyout /ssl/key -out /ssl/cert -subj '/CN=spoke'

from nginx:alpine
run apk add bash
run mkdir /ssl && mkdir -p /www/spoke && mkdir -p /www/spoke/pages && mkdir -p /www/spoke/assets
copy --from=ssl /ssl /ssl
copy --from=builder /spoke/rawspoke/pages /www/spoke/pages
copy --from=builder /spoke/rawspoke/assets /www/spoke/assets
copy scripts/docker/nginx.config /etc/nginx/conf.d/default.conf
copy scripts/docker/run.sh /run.sh
run chmod +x /run.sh && cat /run.sh
cmd bash /run.sh
