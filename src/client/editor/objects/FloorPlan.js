import * as THREE from "three";

export default class FloorPlan extends THREE.Object3D {
  constructor() {
    super();
    this.position.y = 0.005;
    this.visible = false;
    this.navMesh = null;
    this.heightfield = null;
  }

  setNavMesh(object) {
    this.navMesh = object;
    this.add(this.navMesh);
  }

  copy(source, recursive) {
    super.copy(source, false);

    this.heightfield = JSON.parse(JSON.stringify(source.heightfield));

    for (const child of source.children) {
      let clonedChild;

      if (child === source.navMesh) {
        this.setNavMesh(child.clone());
      } else if (recursive === true) {
        clonedChild = child.clone();
      }

      if (clonedChild) {
        this.add(clonedChild);
      }
    }

    return this;
  }
}
