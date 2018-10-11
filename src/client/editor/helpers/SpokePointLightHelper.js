import THREE from "../three";

export default class SpokePointLightHelper extends THREE.Mesh {
  constructor(light, sphereSize) {
    const geometry = new THREE.SphereBufferGeometry(sphereSize, 4, 2);
    const material = new THREE.MeshBasicMaterial({ wireframe: true, fog: false });

    super(geometry, material);

    this.light = light;
    this.light.updateMatrixWorld();

    this.matrix = this.light.matrixWorld;
    this.matrixAutoUpdate = false;

    const distanceGeometry = new THREE.IcosahedronBufferGeometry(1, 2);
    const distanceMaterial = new THREE.MeshBasicMaterial({
      fog: false,
      wireframe: true,
      opacity: 0.1,
      transparent: true
    });

    this.lightDistanceHelper = new THREE.Mesh(distanceGeometry, distanceMaterial);

    this.add(this.lightDistanceHelper);

    this.update();
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.lightDistanceHelper.geometry.dispose();
    this.lightDistanceHelper.material.dispose();
  }

  update() {
    this.material.color.copy(this.light.color);

    const d = this.light.distance;

    if (d === 0.0) {
      this.lightDistanceHelper.visible = false;
    } else {
      this.lightDistanceHelper.visible = true;
      this.lightDistanceHelper.scale.set(d, d, d);
    }
  }
}
