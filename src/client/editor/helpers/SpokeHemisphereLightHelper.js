import THREE from "../../vendor/three";

export default class SpokeHemisphereLightHelper extends THREE.Object3D {
  constructor(light, size, color) {
    super();

    this.light = light;

    this.color = color;

    this.vector = new THREE.Vector3();
    this.color1 = new THREE.Color();
    this.color2 = new THREE.Color();

    const geometry = new THREE.OctahedronBufferGeometry(size);
    geometry.rotateY(Math.PI * 0.5);

    this.material = new THREE.MeshBasicMaterial({ wireframe: true, fog: false });
    if (this.color === undefined) this.material.vertexColors = THREE.VertexColors;

    const position = geometry.getAttribute("position");
    const colors = new Float32Array(position.count * 3);

    geometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));

    this.add(new THREE.Mesh(geometry, this.material));

    this.update();
  }

  update() {
    this.updateMatrixWorld();
    this.lookAt(0, 0, 0);

    const mesh = this.children[0];

    if (this.color !== undefined) {
      this.material.color.set(this.color);
    } else {
      const colors = mesh.geometry.getAttribute("color");

      this.color1.copy(this.light.color);
      this.color2.copy(this.light.groundColor);

      for (let i = 0, l = colors.count; i < l; i++) {
        const color = i < l / 2 ? this.color1 : this.color2;

        colors.setXYZ(i, color.r, color.g, color.b);
      }

      colors.needsUpdate = true;
    }

    this.position.setFromMatrixPosition(this.light.matrixWorld);
    this.lookAt(this.vector.setFromMatrixPosition(this.light.matrixWorld).negate());
  }

  dispose() {
    this.children[0].geometry.dispose();
    this.children[0].material.dispose();
  }
}
