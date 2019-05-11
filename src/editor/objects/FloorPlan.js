import THREE from "../../vendor/three";

export default class FloorPlan extends THREE.Object3D {
  constructor() {
    super();
    this.position.y = 0.005;
    this.navMesh = null;
    this.heightfield = null;
    this.heightfieldMesh = null;
  }

  setNavMesh(object) {
    if (this.navMesh) {
      this.remove(this.navMesh);
    }

    this.navMesh = object;

    if (object) {
      this.add(object);
      this.navMesh.layers.set(1);
      this.navMesh.visible = false;
    }
  }

  setHeightfield(heightfield) {
    this.heightfield = heightfield || null;
  }

  copy(source, recursive) {
    super.copy(source, false);

    this.heightfield = JSON.parse(JSON.stringify(source.heightfield));

    for (const child of source.children) {
      let clonedChild;

      if (child === source.navMesh) {
        clonedChild = child.clone();
        clonedChild.material = child.material.clone();
        this.navMesh = clonedChild;
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
