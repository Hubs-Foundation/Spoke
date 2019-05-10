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

    if (object) {
      this.add(object);
    }

    this.navMesh = object;
    this.navMesh.layers.set(1);
  }

  setHeightfieldMesh(object) {
    if (this.heightfieldMesh) {
      this.remove(this.heightfieldMesh);
    }

    if (object) {
      this.add(object);
    }

    this.heightfieldMesh = object;
    this.heightfieldMesh.layers.set(1);
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
      } else if (child === source.heightfieldMesh) {
        //dont clone the heightfieldMesh
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
