import THREE from "../../vendor/three";

const geometry = new THREE.SphereBufferGeometry(1, 4, 2);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

export default class Picker extends THREE.Mesh {
  constructor() {
    super(geometry, material);
  }
}
