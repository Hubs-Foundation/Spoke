# build stage
FROM node:10 as build-stage


# hubs modules
WORKDIR /spoke
COPY package*.json /spoke/
COPY yarn.lock /spoke/
RUN yarn install 
#--frozen-lockfile

COPY . /spoke/
WORKDIR /spoke


RUN bash ./scripts/write_env_stub.sh
RUN  yarn build
RUN mkdir -p dist/pages
# RUN mv dist/*.html dist/pages


# production stage
FROM nginx:stable as production-stage

COPY scripts/nginx.conf /etc/nginx/conf.d/default.conf
COPY scripts/ /spoke/scripts/
COPY --from=build-stage /spoke/dist /spoke/dist

ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV ROUTER_BASE_PATH=/

ENV BASE_ASSETS_PATH=http://xrchat.local/ 
ENV HUBS_SERVER=xrchat.local:4000
ENV RETICULUM_SERVER=xrchat.local:4000
ENV THUMBNAIL_SERVER=
ENV CORS_PROXY_SERVER=
ENV NON_CORS_PROXY_DOMAINS=
ENV SENTRY_DSN=
ENV GA_TRACKING_ID=
ENV IS_MOZ=false



EXPOSE 80
EXPOSE 443


WORKDIR /spoke
RUN ./scripts/replace_env_stub.sh
RUN cp -r /spoke/dist/. /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
