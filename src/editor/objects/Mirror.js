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
    if (recursive) {
      this.remove(this.mesh);
    }

    super.copy(source, recursive);

    if (recursive) {
      const _meshIndex = source.children.indexOf(source.mesh);

      if (_meshIndex !== -1) {
        this.mesh = this.children[_meshIndex];
      }
    }

    this.color = source.color;

    return this;
  }
}
