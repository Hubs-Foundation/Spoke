import { Object3D, AnimationMixer, PlaneGeometry, MeshBasicMaterial, DoubleSide, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import cloneObject3D from "../utils/cloneObject3D";
import eventToMessage from "../utils/eventToMessage";
import loadErrorTexture from "../utils/loadErrorTexture";

export default class Model extends Object3D {
  constructor() {
    super();
    this.type = "Model";

    this.model = null;
    this.errorMesh = null;
    this._src = null;
    this.animations = [];
    this.clipActions = [];
    this._castShadow = false;
    this._receiveShadow = false;
    this._mixer = new AnimationMixer(this);
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  loadGLTF(src) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(src, resolve, null, e => {
        reject(new Error(`Error loading Model. ${eventToMessage(e)}`));
      });
    });
  }

  async load(src) {
    this._src = src;
    this.animations = [];
    this.clipActions = [];
    this._mixer = new AnimationMixer(this);

    if (this.errorMesh) {
      this.remove(this.errorMesh);
      this.errorMesh = null;
    }

    if (this.model) {
      this.remove(this.model);
      this.model = null;
    }

    try {
      const { scene, animations } = await this.loadGLTF(src);
      if (animations) {
        this.animations = animations;
      }

      this.model = scene;
      this.add(scene);

      this.castShadow = this._castShadow;
      this.receiveShadow = this._receiveShadow;
    } catch (err) {
      const texture = await loadErrorTexture();
      const geometry = new PlaneGeometry();
      const material = new MeshBasicMaterial();
      material.side = DoubleSide;
      material.map = texture;
      material.transparent = true;
      const mesh = new Mesh(geometry, material);
      const ratio = (texture.image.height || 1.0) / (texture.image.width || 1.0);
      const width = Math.min(1.0, 1.0 / ratio);
      const height = Math.min(1.0, ratio);
      mesh.scale.set(width, height, 1);
      this.errorMesh = mesh;
      this.add(mesh);
      console.warn(`Error loading model node with src: "${src}": "${err.message || "unknown error"}"`);
    }

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

  copy(source, recursive = true) {
    super.copy(source, false);

    for (const child of source.children) {
      let clonedChild;

      if (child === source.model) {
        clonedChild = cloneObject3D(child);
        this.model = clonedChild;
      } else if (recursive === true && child !== source.errorMesh) {
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
