import { Box3, Sphere, PropertyBinding } from "three";
import Model from "../objects/Model";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes } from "../StaticMode";
import cloneObject3D from "../utils/cloneObject3D";
import { RethrownError } from "../utils/errors";
import { getObjectPerfIssues, maybeAddLargeFileIssue } from "../utils/performance";

const defaultStats = {
  nodes: 0,
  meshes: 0,
  materials: 0,
  textures: 0,
  polygons: 0,
  vertices: 0,
  jsonSize: 0,
  bufferInfo: {},
  textureInfo: {},
  meshInfo: {}
};

export default class ModelNode extends EditorNodeMixin(Model) {
  static nodeName = "Model";

  static legacyComponentName = "gltf-model";

  static initialElementProps = {
    initialScale: "fit",
    src: "https://sketchfab.com/models/a4c500d7358a4a199b6a5cd35f416466"
  };

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    loadAsync(
      (async () => {
        const { src, attribution } = json.components.find(c => c.name === "gltf-model").props;

        await node.load(src, onError);

        // Legacy, might be a raw string left over before switch to JSON.
        if (attribution && typeof attribution === "string") {
          const [name, author] = attribution.split(" by ");
          node.attribution = { name, author };
        } else {
          node.attribution = attribution;
        }

        node.collidable = !!json.components.find(c => c.name === "collidable");
        node.walkable = !!json.components.find(c => c.name === "walkable");

        const loopAnimationComponent = json.components.find(c => c.name === "loop-animation");

        if (loopAnimationComponent && loopAnimationComponent.props) {
          const { clip, activeClipIndex } = loopAnimationComponent.props;

          if (activeClipIndex !== undefined) {
            node.activeClipIndex = loopAnimationComponent.props.activeClipIndex;
          } else if (clip !== undefined && node.model && node.model.animations) {
            // DEPRECATED: Old loop-animation component stored the clip name rather than the clip index
            node.activeClipIndex = node.model.animations.findIndex(animation => animation.name === clip);
          }
        }

        const shadowComponent = json.components.find(c => c.name === "shadow");

        if (shadowComponent) {
          node.castShadow = shadowComponent.props.cast;
          node.receiveShadow = shadowComponent.props.receive;
        }
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor);
    this.attribution = null;
    this._canonicalUrl = "";
    this.collidable = true;
    this.walkable = true;
    this.initialScale = 1;
    this.boundingBox = new Box3();
    this.boundingSphere = new Sphere();
    this.stats = defaultStats;
    this.gltfJson = null;
  }

  // Overrides Model's src property and stores the original (non-resolved) url.
  get src() {
    return this._canonicalUrl;
  }

  // When getters are overridden you must also override the setter.
  set src(value) {
    this.load(value).catch(console.error);
  }

  // Overrides Model's loadGLTF method and uses the Editor's gltf cache.
  async loadGLTF(src) {
    const loader = this.editor.gltfCache.getLoader(src);

    const { scene, json, stats } = await loader.getDependency("gltf");

    this.stats = stats;
    this.gltfJson = json;

    const clonedScene = cloneObject3D(scene);

    const sketchfabExtras = json.asset && json.asset.extras;

    if (sketchfabExtras) {
      const name = sketchfabExtras.title;
      const author = sketchfabExtras.author ? sketchfabExtras.author.replace(/ \(http.+\)/, "") : "";
      const url = sketchfabExtras.source || this._canonicalUrl;
      clonedScene.name = name;
      this.attribution = { name, author, url };
    }

    return clonedScene;
  }

  // Overrides Model's load method and resolves the src url before loading.
  async load(src, onError) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl && nextSrc !== "") {
      return;
    }

    this._canonicalUrl = nextSrc;
    this.attribution = null;
    this.issues = [];
    this.stats = defaultStats;
    this.gltfJson = null;

    if (this.model) {
      this.editor.renderer.removeBatchedObject(this.model);
      this.remove(this.model);
      this.model = null;
    }

    this.hideErrorIcon();
    this.showLoadingCube();

    try {
      const { accessibleUrl, files } = await this.editor.api.resolveMedia(src);

      if (this.model) {
        this.editor.renderer.removeBatchedObject(this.model);
      }

      await super.load(accessibleUrl);

      if (this.stats) {
        const textureInfo = this.stats.textureInfo;
        for (const key in textureInfo) {
          if (!Object.prototype.hasOwnProperty.call(textureInfo, key)) continue;
          const info = textureInfo[key];

          if (info.size === undefined) {
            let file;

            for (const name in files) {
              if (Object.prototype.hasOwnProperty.call(files, name) && files[name].url === info.url) {
                file = files[name];
                break;
              }
            }

            if (file) {
              info.size = file.size;
              this.stats.totalSize += file.size;
            }
          }
        }
      }

      if (this.model) {
        this.editor.renderer.addBatchedObject(this.model);
      }

      if (this.initialScale === "fit") {
        this.scale.set(1, 1, 1);

        if (this.model) {
          this.updateMatrixWorld();
          this.boundingBox.setFromObject(this.model);
          this.boundingBox.getBoundingSphere(this.boundingSphere);

          const diameter = this.boundingSphere.radius * 2;

          if ((diameter > 1000 || diameter < 0.1) && diameter !== 0) {
            // Scale models that are too big or to small to fit in a 1m bounding sphere.
            const scaleFactor = 1 / diameter;
            this.scale.set(scaleFactor, scaleFactor, scaleFactor);
          } else if (diameter > 20) {
            // If the bounding sphere of a model is over 20m in diameter, assume that the model was
            // exported with units as centimeters and convert to meters.
            this.scale.set(0.01, 0.01, 0.01);
          }
        }

        // Clear scale to fit property so that the swapped model maintains the same scale.
        this.initialScale = 1;
      } else {
        this.scale.multiplyScalar(this.initialScale);
        this.initialScale = 1;
      }

      if (this.model) {
        this.model.traverse(object => {
          if (object.material && object.material.isMeshStandardMaterial) {
            object.material.envMap = this.editor.scene.environmentMap;
            object.material.needsUpdate = true;
          }
        });

        this.issues = getObjectPerfIssues(this.model);
        maybeAddLargeFileIssue("gltf", this.stats.totalSize, this.issues);
      }

      this.updateStaticModes();

      // if (files) {
      //   // Revoke any object urls from the SketchfabZipLoader.
      //   for (const key in files) {
      //     if (Object.prototype.hasOwnProperty.call(files, key)) {
      //       URL.revokeObjectURL(files[key].url);
      //     }
      //   }
      // }
    } catch (error) {
      this.showErrorIcon();

      const modelError = new RethrownError(`Error loading model "${this._canonicalUrl}"`, error);

      if (onError) {
        onError(this, modelError);
      }

      console.error(modelError);

      this.issues.push({ severity: "error", message: "Error loading model." });
    }

    this.editor.emit("objectsChanged", [this]);
    this.editor.emit("selectionChanged");
    this.hideLoadingCube();

    return this;
  }

  onAdd() {
    if (this.model) {
      this.editor.renderer.addBatchedObject(this.model);
    }
  }

  onRemove() {
    if (this.model) {
      this.editor.renderer.removeBatchedObject(this.model);
    }
  }

  onPlay() {
    this.playAnimation();
  }

  onPause() {
    this.stopAnimation();
  }

  onUpdate(dt) {
    super.onUpdate(dt);

    if (this.editor.playing) {
      this.update(dt);
    }
  }

  updateStaticModes() {
    if (!this.model) return;

    setStaticMode(this.model, StaticModes.Static);

    if (this.model.animations && this.model.animations.length > 0) {
      for (const animation of this.model.animations) {
        for (const track of animation.tracks) {
          const { nodeName: uuid } = PropertyBinding.parseTrackName(track.name);
          const animatedNode = this.model.getObjectByProperty("uuid", uuid);

          if (!animatedNode) {
            throw new Error(
              `Model.updateStaticModes: model with url "${this._canonicalUrl}" has an invalid animation "${animation.name}"`
            );
          }

          setStaticMode(animatedNode, StaticModes.Dynamic);
        }
      }
    }
  }

  serialize() {
    const components = {
      "gltf-model": {
        src: this._canonicalUrl,
        attribution: this.attribution
      },
      shadow: {
        cast: this.castShadow,
        receive: this.receiveShadow
      }
    };

    if (this.activeClipIndex !== -1) {
      components["loop-animation"] = {
        activeClipIndex: this.activeClipIndex
      };
    }

    if (this.collidable) {
      components.collidable = {};
    }

    if (this.walkable) {
      components.walkable = {};
    }

    return super.serialize(components);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    if (source.loadingCube) {
      this.initialScale = source.initialScale;
      this.load(source.src);
    } else {
      this.updateStaticModes();
      this.stats = JSON.parse(JSON.stringify(source.stats));
      this.gltfJson = source.gltfJson;
      this._canonicalUrl = source._canonicalUrl;
    }

    this.attribution = source.attribution;
    this.collidable = source.collidable;
    this.walkable = source.walkable;
    return this;
  }

  prepareForExport(ctx) {
    super.prepareForExport();
    this.addGLTFComponent("shadow", {
      cast: this.castShadow,
      receive: this.receiveShadow
    });

    // TODO: Support exporting more than one active clip.
    if (this.activeClip) {
      const activeClipIndex = ctx.animations.indexOf(this.activeClip);

      if (activeClipIndex === -1) {
        throw new Error(
          `Error exporting model "${this.name}" with url "${this._canonicalUrl}". Animation could not be found.`
        );
      } else {
        this.addGLTFComponent("loop-animation", {
          activeClipIndex: activeClipIndex
        });
      }
    }
  }
}
