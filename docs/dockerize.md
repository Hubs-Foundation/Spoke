# Runing Spoke inside docker container

There are 2 docker flavours if this repo:

1. Dockerfile generated repo, with just dependeicies on NodeJS and Nginx.
2. Habitat generated image, that uses Chef Habitat to build, run, configure, and supervise the spoke web server at runtime.


## Dockerfile generated image

You can run it using docker, if you don't have node installed or need to test.
``` bash
# Build the image
docker build --tag spoke .

# Run the image (deletes itself when you close it)
docker run -d --rm --name spoke -e "HUBS_SERVER=xrchat.local" -p "8080:80"  spoke

# Stop the server
docker stop spoke
```

### Docker image configurations

Enviroment variables:
- BASE_ASSETS_PATH: [http://xrchat.local/]
- HUBS_SERVER: [xrchat.local:4000]
- RETICULUM_SERVER: [xrchat.local:4000]
- THUMBNAIL_SERVER: []
- CORS_PROXY_SERVER: []
- NON_CORS_PROXY_DOMAINS: []
- SENTRY_DSN: []
- GA_TRACKING_ID: []
- IS_MOZ: [false]


## Habitat generated image

This relies on Chef Habitat Builder (Acting as a CI and a build system)
Habitat builder pulls the repo from github #master then builds the image.

docker run -it --rm --env HAB_LICENSE=accept-no-persist  xrchat/spoke
