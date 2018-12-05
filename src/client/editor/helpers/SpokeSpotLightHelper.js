import THREE from "../../vendor/three";

export default class SpokeSpotLightHelper extends THREE.Object3D {
  constructor(light, color) {
    super();

    this.light = light;

    this.color = color;

    const geometry = new THREE.BufferGeometry();

    const positions = [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, 1];

    for (let i = 0, j = 1, l = 32; i < l; i++, j++) {
      const p1 = (i / l) * Math.PI * 2;
      const p2 = (j / l) * Math.PI * 2;

      positions.push(Math.cos(p1), Math.sin(p1), 1, Math.cos(p2), Math.sin(p2), 1);
    }

    geometry.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({ fog: false });

    this.outerCone = new THREE.LineSegments(geometry, material);
    this.outerCone.layers.set(1);
    this.outerCone.rotateY(Math.PI);
    this.add(this.outerCone);

    this.innerCone = new THREE.LineSegments(geometry, material);
    this.innerCone.layers.set(1);
    this.innerCone.rotateY(Math.PI);
    this.add(this.innerCone);

    this.update();
  }

  dispose() {
    this.outerCone.geometry.dispose();
    this.outerCone.material.dispose();
  }

  update = () => {
    this.light.updateMatrixWorld();

    const coneLength = this.light.distance ? this.light.distance : 1000;
    const outerConeWidth = coneLength * Math.tan(this.light.angle);
    const innerConeAngle = (1 - this.light.penumbra) * this.light.angle;
    const innerConeWidth = coneLength * Math.tan(innerConeAngle);

    this.outerCone.scale.set(outerConeWidth, outerConeWidth, coneLength);
    this.innerCone.scale.set(innerConeWidth, innerConeWidth, coneLength);

    if (this.color !== undefined) {
      this.outerCone.material.color.set(this.color);
      this.innerCone.material.color.set(this.color);
    } else {
      this.outerCone.material.color.copy(this.light.color);
      this.innerCone.material.color.copy(this.light.color);
    }
  };
}
