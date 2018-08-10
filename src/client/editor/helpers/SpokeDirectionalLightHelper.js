import THREE from "../../vendor/three";

export default class SpokeDirectionalLightHelper extends THREE.Object3D {
  constructor(light, size, color) {
    super();

    this.light = light;
    this.light.updateMatrixWorld();

    this.matrix = light.matrixWorld;
    this.matrixAutoUpdate = false;

    this.color = color;

    if (size === undefined) size = 1;

    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0, -size, size, 0],
        3
      )
    );

    const material = new THREE.LineBasicMaterial({ fog: false });

    this.lightPlane = new THREE.Line(geometry, material);
    this.add(this.lightPlane);

    geometry = new THREE.BufferGeometry();
    geometry.addAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 1], 3));

    this.targetLine = new THREE.Line(geometry, material);
    this.add(this.targetLine);

    this.update();
  }

  update() {
    if (this.color !== undefined) {
      this.lightPlane.material.color.set(this.color);
      this.targetLine.material.color.set(this.color);
    } else {
      this.lightPlane.material.color.copy(this.light.color);
      this.targetLine.material.color.copy(this.light.color);
    }
  }

  dispose() {
    this.lightPlane.geometry.dispose();
    this.lightPlane.material.dispose();
    this.targetLine.geometry.dispose();
    this.targetLine.material.dispose();
  }
}
