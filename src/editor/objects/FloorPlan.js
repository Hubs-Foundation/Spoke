import { Object3D } from "three";

export default class FloorPlan extends Object3D {
  constructor() {
    super();
    this.position.y = 0.005;
    this.navMesh = null;
    this.trimesh = null;
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

  setTrimesh(object) {
    if (this.trimesh) {
      this.remove(this.trimesh);
    }

    this.trimesh = object;

    if (object) {
      this.add(object);
      this.trimesh.layers.set(1);
      this.trimesh.visible = false;
    }
  }

  setHeightfield(heightfield) {
    this.heightfield = heightfield || null;
  }

  copy(source, recursive = true) {
    this.heightfield = JSON.parse(JSON.stringify(source.heightfield));

    if (recursive) {
      this.remove(this.navMesh);
      this.remove(this.trimesh);
    }

    super.copy(source, recursive);

    if (recursive) {
      const navMeshIndex = source.children.indexOf(source.navMesh);

      if (navMeshIndex !== -1) {
        this.navMesh = this.children[navMeshIndex];
      }

      const trimeshIndex = source.children.indexOf(source.trimesh);

      if (trimeshIndex !== -1) {
        this.trimesh = this.children[trimeshIndex];
      }
    }

    return this;
  }
}
