import { Object3D, AnimationMixer, LoopRepeat } from "three";
import { GLTFLoader } from "../gltf/GLTFLoader";
import cloneObject3D from "../utils/cloneObject3D";

export default class Model extends Object3D {
  constructor() {
    super();
    this.type = "Model";

    this.model = null;
    this._src = null;
    this._castShadow = false;
    this._receiveShadow = false;
    this._combine = true;
    this.activeClipItems = [];
    this.animationMixer = null;
    this.currentActions = [];
    this.meta = null;
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  async loadGLTF(src) {
    const gltf = await new GLTFLoader(src).loadGLTF();

    const model = gltf.scene;

    model.animations = model.animations || [];

    return model;
  }

  async load(src, ...args) {
    this._src = src;

    if (this.model) {
      this.remove(this.model);
      this.model = null;
    }

    const model = await this.loadGLTF(src, ...args);
    model.animations = model.animations || [];
    this.model = model;
    this.add(model);

    if (model.animations && model.animations.length > 0) {
      this.animationMixer = new AnimationMixer(this.model);
    }

    this.castShadow = this._castShadow;
    this.receiveShadow = this._receiveShadow;
    this.combine = this._combine;

    return this;
  }

  getClipOptions() {
    const clipOptions =
      this.model && this.model.animations
        ? this.model.animations.map((clip, index) => ({ label: clip.name, value: index }))
        : [];
    if (clipOptions.length == 0) {
      clipOptions.unshift({ label: "None", value: -1 });
    }
    return clipOptions;
  }

  getActiveItems(indices) {
    if (this.model && this.model.animations) {
      return indices
        .filter(item => item >= 0 && this.model.animations[item])
        .map(item => {
          const clip = this.model.animations[item];
          return { label: clip.name, value: item };
        });
    }
    return [];
  }

  get activeClipIndices() {
    const activeClipIndices = this.activeClips.map(clip => {
      const index = this.model.animations.indexOf(clip);
      if (index === -1) {
        throw new Error(
          `Error exporting model "${this.name}" with url "${this._canonicalUrl}". Animation could not be found.`
        );
      }
      return index;
    });
    return activeClipIndices;
  }

  get activeClips() {
    if (this.model && this.model.animations) {
      return this.activeClipItems
        .filter(item => item.value >= 0)
        .map(item => this.model.animations.find(({ name }) => name === item.label));
    }
    return [];
  }

  get clips() {
    return this.model.animations;
  }

  updateAnimationState() {
    if (this.model.animations.length === 0) {
      return;
    }

    const activeClips = this.activeClips;

    if (!activeClips) return;

    this.currentActions.length = 0;

    for (let i = 0; i < activeClips.length; i++) {
      const action = this.animationMixer.clipAction(activeClips[i], this.model);
      action.enabled = true;
      action.setLoop(LoopRepeat, Infinity).play();
      this.currentActions.push(action);
    }
  }

  playAnimation() {
    this.updateAnimationState();
  }

  stopAnimation() {
    for (let i = 0; i < this.currentActions.length; i++) {
      this.currentActions[i].enabled = false;
      this.currentActions[i].stop();
    }
    this.currentActions.length = 0;
  }

  update(dt) {
    if (this.animationMixer) {
      this.updateAnimationState();
      this.animationMixer.update(dt);
    }
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

  setShadowsEnabled(enabled) {
    if (this.model) {
      this.model.traverse(child => {
        child.castShadow = enabled ? this._castShadow : false;
        child.receiveShadow = enabled ? this._receiveShadow : false;

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

  get combine() {
    return this._combine;
  }

  set combine(value) {
    this._combine = value;

    if (this.model) {
      this.model.traverse(child => {
        child._combine = value;
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

        if (this.model.animations.length > 0) {
          this.animationMixer = new AnimationMixer(this.model);
        }
      } else if (recursive === true && child !== source.loadingCube) {
        clonedChild = child.clone();
      }

      if (clonedChild) {
        this.add(clonedChild);
      }
    }

    this._src = source._src;
    this.activeClipItems = source.activeClipItems;

    return this;
  }
}
