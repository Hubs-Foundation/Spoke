import THREE from "../../vendor/three";
import cloneObject3D from "../utils/cloneObject3D";

export default class Model extends THREE.Object3D {
  constructor() {
    super();
    this.type = "Model";

    this._src = null;
    this.animations = [];
    this.clipActions = [];
    this._castShadow = false;
    this._receiveShadow = false;
    this._mixer = new THREE.AnimationMixer(this);
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  loadGLTF(src) {
    return new Promise((resolve, reject) => {
      new THREE.GLTFLoader().load(src, resolve, null, reject);
    });
  }

  async load(src) {
    this._src = src;

    const { scene, animations } = await this.loadGLTF(src);

    if (animations) {
      this.animations = this.animations.concat(animations);
    }

    this.model = scene;
    this.add(scene);

    return this;
  }

  get activeClip() {
    if (this.clipActions.length > 0) {
      return this.clipActions[0].getClip();
    }

    return null;
  }

  getClipNames() {
    return this.animations.map(clip => clip.name);
  }

  get activeClipName() {
    if (this.clipActions.length > 0) {
      return this.clipActions[0].getClip().name;
    }

    return null;
  }

  set activeClipName(clipName) {
    this.clipActions = [];
    this.addClipAction(clipName);
  }

  addClipAction(clipName) {
    const clip = this.animations.find(c => c.name === clipName) || null;

    if (!clip) {
      return null;
    }

    const clipAction = this._mixer.clipAction(clip);
    this.clipActions.push(clipAction);
    return clipAction;
  }

  removeClipAction(clipName) {
    const index = this.clipActions.findIndex(a => a.getClip().name === clipName);

    if (index === -1) {
      this.clipActions.splice(index, 1);
      return true;
    }

    return false;
  }

  get castShadow() {
    return this._castShadow;
  }

  set castShadow(value) {
    this._castShadow = value;

    if (this.model) {
      this.model.traverse(child => {
        child.castShadow = value;

        if (child.material) {
          const material = child.material;

          if (Array.isArray(material)) {
            for (let i = 0; i < material.length; i++) {
              material[i].needsUpdate = true;
            }
          } else {
            material.needsUpdate = true;
          }
        }
      });
    }
  }

  get receiveShadow() {
    return this._receiveShadow;
  }

  set receiveShadow(value) {
    this._receiveShadow = value;

    if (this.model) {
      this.model.traverse(child => {
        child.receiveShadow = value;

        if (child.material) {
          const material = child.material;

          if (Array.isArray(material)) {
            for (let i = 0; i < material.length; i++) {
              material[i].needsUpdate = true;
            }
          } else {
            material.needsUpdate = true;
          }
        }
      });
    }
  }

  // TODO: Add play/pause methods for previewing animations.

  copy(source, recursive) {
    super.copy(source, false);

    for (const child of source.children) {
      let clonedChild;

      if (child === source.model) {
        clonedChild = cloneObject3D(child);
        this.model = clonedChild;
      } else if (recursive === true) {
        clonedChild = child.clone();
      }

      if (clonedChild) {
        this.add(clonedChild);
      }
    }

    this.animations = this.animations.concat(source.animations);
    this._src = source._src;

    for (const clipAction of source.clipActions) {
      this.addClipAction(clipAction.getClip().name);
    }

    return this;
  }

  update(dt) {
    this._mixer.update(dt);
  }
}
