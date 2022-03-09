import { Object3D, PlaneBufferGeometry, Color } from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector";

export default class Mirror extends Object3D {
  constructor(color) {
    super();

    this.mesh = new Reflector(new PlaneBufferGeometry(), { color });
    this.add(this.mesh);
  }

  get color() {
    return this.mesh.material.uniforms.color.value;
  }

  set color(value) {
    this.mesh.material.uniforms.color.value = new Color(value);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    return this;
  }
}
