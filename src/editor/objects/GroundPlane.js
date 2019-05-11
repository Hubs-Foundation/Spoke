import THREE from "../../vendor/three";

export default class GroundPlane extends THREE.Object3D {
  static _geometry = new THREE.CircleBufferGeometry(4000, 32);

  constructor() {
    super();

    this._receiveShadow = true;

    const material = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, color: "#5DE336" });
    const mesh = new THREE.Mesh(GroundPlane._geometry, material);
    mesh.position.y = -0.05;
    mesh.rotation.x = -Math.PI / 2;
    this.mesh = mesh;
    this.mesh.receiveShadow = this.receiveShadow;
    this.add(this.mesh);
  }

  get color() {
    return this.mesh.material.color;
  }

  get receiveShadow() {
    return this._receiveShadow;
  }

  set receiveShadow(value) {
    this._receiveShadow = value;

    if (this.mesh) {
      this.mesh.receiveShadow = value;

      const material = this.mesh.material;

      if (Array.isArray(material)) {
        for (let i = 0; i < material.length; i++) {
          material[i].needsUpdate = true;
        }
      } else {
        material.needsUpdate = true;
      }
    }
  }

  copy(source, recursive) {
    super.copy(source, false);

    if (recursive) {
      for (const child of source.children) {
        if (child !== this.mesh) {
          const clonedChild = child.clone();
          this.add(clonedChild);
        }
      }
    }

    this.color.copy(source.color);

    return this;
  }
}
