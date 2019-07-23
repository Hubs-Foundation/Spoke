import { Line, Object3D, BufferGeometry, LineBasicMaterial, Float32BufferAttribute } from "three";
import { addIsHelperFlag } from "./utils";

export default class DirectionalPlaneHelper extends Object3D {
  constructor(size = 1) {
    super();

    this.name = "DirectionalPlaneHelper";

    let geometry = new BufferGeometry();
    geometry.addAttribute(
      "position",
      new Float32BufferAttribute([-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0, -size, size, 0], 3)
    );

    const material = new LineBasicMaterial({ fog: false });

    this.plane = new Line(geometry, material);
    this.plane.layers.set(1);
    this.add(this.plane);

    geometry = new BufferGeometry();
    geometry.addAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, 0, 1], 3));

    this.directionLine = new Line(geometry, material);
    this.directionLine.layers.set(1);
    this.add(this.directionLine);

    addIsHelperFlag(this);
  }

  setColor(color) {
    this.plane.material.color.copy(color);
    this.directionLine.material.color.copy(color);
  }

  dispose() {
    this.plane.geometry.dispose();
    this.plane.material.dispose();
    this.directionLine.geometry.dispose();
    this.directionLine.material.dispose();
  }
}
