import { Object3D, PlaneBufferGeometry, MeshBasicMaterial, DoubleSide, Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import cloneObject3D from "../utils/cloneObject3D";
import eventToMessage from "../utils/eventToMessage";
import loadErrorTexture from "../utils/loadErrorTexture";
import { findKitPiece } from "../kits/kit-piece-utils";

export default class Model extends Object3D {
  constructor() {
    super();
    this.type = "Model";

    this.model = null;
    this.errorMesh = null;
    this._src = null;
    this._pieceId = null;
    this._castShadow = false;
    this._receiveShadow = false;
    // Use index instead of references to AnimationClips to simplify animation cloning / track name remapping
    this.activeClipIndex = -1;
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this.load(value, this.pieceId).catch(console.error);
  }

  get pieceId() {
    return this._pieceId;
  }

  set pieceId(value) {
    this.load(this.src, value).catch(console.error);
  }

  async loadGLTF(src, pieceId) {
    try {
      const gltf = await new Promise((resolve, reject) => {
        new GLTFLoader().load(src, resolve, null, reject);
      });

      let model = gltf.scene;

      if (pieceId != null) {
        model = findKitPiece(gltf.scene, pieceId);
      }

      model.animations = model.animations || [];

      return model;
    } catch (e) {
      throw new Error(`Error loading Model. ${eventToMessage(e)}`);
    }
  }

  async load(src, pieceId) {
    this._src = src;
    this._pieceId = pieceId;

    if (this.errorMesh) {
      this.remove(this.errorMesh);
      this.errorMesh = null;
    }

    if (this.model) {
      this.remove(this.model);
      this.model = null;
    }

    try {
      const model = await this.loadGLTF(src, this._pieceId);
      this.model = model;
      this.add(model);

      this.castShadow = this._castShadow;
      this.receiveShadow = this._receiveShadow;
    } catch (err) {
      const texture = await loadErrorTexture();
      const geometry = new PlaneBufferGeometry();
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
      console.error(err);
    }

    return this;
  }

  getClipOptions() {
    const clipOptions =
      this.model && this.model.animations
        ? this.model.animations.map((clip, index) => ({ label: clip.name, value: index }))
        : [];
    clipOptions.unshift({ label: "None", value: -1 });
    return clipOptions;
  }

  get activeClip() {
    return (this.model && this.model.animations && this.model.animations[this.activeClipIndex]) || null;
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

    this._src = source._src;
    this._pieceId = source._pieceId;
    this.activeClipIndex = source.activeClipIndex;

    return this;
  }
}
