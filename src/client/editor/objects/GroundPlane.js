import THREE from "../three";

export default class GroundPlane extends THREE.Object3D {
  static _geometry = new THREE.CircleBufferGeometry(4000, 32);

  constructor() {
    super();

    const material = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, color: "#4F3622" });
    const mesh = new THREE.Mesh(GroundPlane._geometry, material);
    mesh.position.y = -0.05;
    mesh.rotation.x = -Math.PI / 2;
    this.mesh = mesh;
    this.add(this.mesh);
  }

  get color() {
    return this.mesh.material.color;
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
