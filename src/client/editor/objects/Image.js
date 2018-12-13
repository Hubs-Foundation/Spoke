import THREE from "../../vendor/three";

export const ImageProjection = {
  Flat: "flat",
  Equirectangular: "equirectangular"
};

export default class Image extends THREE.Object3D {
  constructor() {
    super();
    this._src = null;
    this._projection = "flat";

    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial();
    material.side = THREE.DoubleSide;
    this._mesh = new THREE.Mesh(geometry, material);
    this._texture = null;
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

  get projection() {
    return this._projection;
  }

  set projection(projection) {
    const material = new THREE.MeshBasicMaterial();

    let geometry;

    if (projection === "equirectangular") {
      geometry = new THREE.SphereBufferGeometry(1, 64, 32);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1);
    } else {
      geometry = new THREE.PlaneGeometry();
      material.side = THREE.DoubleSide;
    }

    material.map = this._mesh.material.map;

    this._projection = projection;

    // Replace existing mesh
    this.remove(this._mesh);
    this._mesh = new THREE.Mesh(geometry, material);
    this.add(this._mesh);
  }

  async load(src) {
    this._src = src;

    const material = this._mesh.material;

    if (material.map) {
      material.map.dispose();
    }

    if (!src) {
      material.map = null;
      return;
    }

    const texture = await this.loadTexture(src);

    if (this.projection === "flat") {
      const ratio = (texture.image.height || 1.0) / (texture.image.width || 1.0);
      const width = Math.min(1.0, 1.0 / ratio);
      const height = Math.min(1.0, ratio);
      this._mesh.scale.set(width, height, 1);
    }

    // TODO: resize to maintain aspect ratio but still allow scaling.
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;

    if (texture.format === THREE.RGBAFormat) {
      material.transparent = true;
    }

    this._texture = texture;
    material.map = texture;
    material.needsUpdate = true;

    return this;
  }

  copy(source, recursive) {
    super.copy(source, false);

    this.remove(this._mesh);

    for (const child of source.children) {
      let clonedChild;

      if (child === source._mesh) {
        clonedChild = child.clone();
        this._mesh = clonedChild;
      } else if (recursive === true) {
        clonedChild = child.clone();
      }

      if (clonedChild) {
        this.add(clonedChild);
      }
    }

    this._src = source._src;
    this._texture = source._texture;
    this._projection = source._projection;

    return this;
  }
}
