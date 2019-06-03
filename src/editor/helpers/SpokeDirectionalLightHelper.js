import { Line, Object3D, BufferGeometry, LineBasicMaterial, Float32BufferAttribute } from "three";
import { addIsHelperFlag } from "./utils";

export default class SpokeDirectionalLightHelper extends Object3D {
  constructor(light, size, color) {
    super();

    this.name = "SpokeDirectionalLightHelper";

    this.light = light;

    this.color = color;

    if (size === undefined) size = 1;

    let geometry = new BufferGeometry();
    geometry.addAttribute(
      "position",
      new Float32BufferAttribute([-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0, -size, size, 0], 3)
    );

    const material = new LineBasicMaterial({ fog: false });

    this.lightPlane = new Line(geometry, material);
    this.lightPlane.layers.set(1);
    this.add(this.lightPlane);

    geometry = new BufferGeometry();
    geometry.addAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, 0, 1], 3));

    this.targetLine = new Line(geometry, material);
    this.targetLine.layers.set(1);
    this.add(this.targetLine);

    this.update();
    addIsHelperFlag(this);
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
