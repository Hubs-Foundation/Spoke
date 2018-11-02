# Spoke (beta)

[https://hubs.mozilla.com/spoke](https://hubs.mozilla.com/spoke)

Easily create custom 3D environments for [Mozilla Hubs](https://hubs.mozilla.com).

## Development

- `git clone https://github.com/MozillaReality/Spoke.git`
- `cd Spoke`
- `npm ci`
- `npm run dev`

When running against a local self-signed cert reticulum server, you'll need to `export NODE_TLS_REJECT_UNAUTHORIZED=0` for publishing to work.

Then open http://localhost:9090.

## Credits

Parts of this project are derived from the [three.js editor](https://threejs.org/editor/)
with thanks to [Mr.doob](https://github.com/mrdoob) and three.js' many contributors.

Navigation mesh generation via recast.wasm, thanks to [Recast](https://github.com/recastnavigation/recastnavigation) and but0n's [RecastCLI wrapper](https://github.com/but0n/recastCLI.js).

See the [LICENSE](LICENSE) for details.
