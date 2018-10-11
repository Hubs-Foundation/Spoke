import THREE from "../three";

export default class SpokePointLightHelper extends THREE.Mesh {
  constructor(light, sphereSize, color) {
    const geometry = new THREE.SphereBufferGeometry(sphereSize, 4, 2);
    const material = new THREE.MeshBasicMaterial({ wireframe: true, fog: false });

    super(geometry, material);

    this.light = light;
    this.light.updateMatrixWorld();

    this.color = color;

    this.matrix = this.light.matrixWorld;
    this.matrixAutoUpdate = false;

    const distanceGeometry = new THREE.IcosahedronGeometry(1, 2);
    const distanceMaterial = new THREE.MeshBasicMaterial({
      color: color,
      fog: false,
      wireframe: true,
      opacity: 0.1,
      transparent: true
    });

    this.lightDistanceHelper = new THREE.Mesh(distanceGeometry, distanceMaterial);

    const d = light.distance;

    if (d === 0.0) {
      this.lightDistanceHelper.visible = false;
    } else {
      this.lightDistanceHelper.scale.set(d, d, d);
    }

    this.add(this.lightDistanceHelper);

    this.update();
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }

  update() {
    if (this.color !== undefined) {
      this.material.color.set(this.color);
    } else {
      this.material.color.copy(this.light.color);
    }

    const d = this.light.distance;

    if (d === 0.0) {
      this.lightDistanceHelper.visible = false;
    } else {
      this.lightDistanceHelper.visible = true;
      this.lightDistanceHelper.scale.set(d, d, d);
    }
  }
}
