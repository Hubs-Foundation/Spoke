import THREE from "../../vendor/three";

export default class Image extends THREE.Mesh {
  constructor() {
    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial();
    material.side = THREE.DoubleSide;
    super(geometry, material);
    this._src = null;
  }

  get src() {
    return this._src;
  }

  set src(src) {
    this.load(src).catch(console.error);
  }

  loadTexture(src) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(src, resolve, null, () => reject(`Error loading Image "${src}"`));
    });
  }

  async load(src) {
    this._src = src;

    const material = this.material;

    if (material.map) {
      material.map.dispose();
    }

    if (!src) {
      material.map = null;
      return;
    }

    const texture = await this.loadTexture(src);

    // TODO: resize to maintain aspect ratio but still allow scaling.
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;

    if (texture.format === THREE.RGBAFormat) {
      material.transparent = true;
    }

    material.map = texture;
    material.needsUpdate = true;

    return this;
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    this._src = source._src;

    return this;
  }
}
