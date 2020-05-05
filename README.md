<h1 align="center">Spoke</h1>

<p align="center"><a href="https://hubs.mozilla.com/spoke" target="_blank"><img width="480" alt="Spoke" src="https://user-images.githubusercontent.com/21111451/66261819-ffd9ff00-e799-11e9-88bf-981d238b4f20.gif"></a></p>

[![CircleCI](https://circleci.com/gh/mozilla/Spoke.svg?style=svg)](https://circleci.com/gh/mozilla/Spoke)


  **Easily create custom 3D environments for [Mozilla Hubs](https://hubs.mozilla.com).**

**[https://hubs.mozilla.com/spoke](https://hubs.mozilla.com/spoke)**

## Features

:telescope: **Discover**: Explore images, videos, and 3D models from around the web, all without opening up a new tab. With media integrations from Sketchfab and Google Poly, you'll be on your way to creating a scene in no time.

:pencil2: **Create**: No external software or 3D modeling experience required - build 3D scenes using the Spoke web editor so you can have a space that's entirely custom to your needs. From a board room to outer space and beyond, your space is in your control.

:tada: **Share**: Invite people to meet in your new space by publishing your content to Hubs immediately. With just a few clicks, you'll have a world of your own to experience and share - all from your browser.

## Development

- `git clone https://github.com/mozilla/Spoke.git`
- `cd Spoke`
- `yarn install`
- `yarn start`

Then open **https://localhost:9090** (note: HTTPS is required).

When running against a local self-signed cert reticulum server, you'll need to `export NODE_TLS_REJECT_UNAUTHORIZED=0` for publishing to work.

## Docker

To run inside a docker container, check [Dockerizing Spoke](docs/dockerize.md) document.

## Credits

Parts of this project are derived from the [three.js editor](https://threejs.org/editor/)
with thanks to [Mr.doob](https://github.com/mrdoob) and three.js' many contributors.

Navigation mesh generation via recast.wasm, thanks to [Recast](https://github.com/recastnavigation/recastnavigation) and but0n's [RecastCLI wrapper](https://github.com/but0n/recastCLI.js).

See the [LICENSE](LICENSE) for details.
