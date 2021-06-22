import { Box3, Sphere } from "three";
import Model from "../objects/Model";
import EditorNodeMixin from "./EditorNodeMixin";
import cloneObject3D from "../utils/cloneObject3D";
import { RethrownError } from "../utils/errors";
import { collectUniqueMaterials } from "../utils/materials";
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

export default class SpawnerNode extends EditorNodeMixin(Model) {
  static componentName = "spawner";

  static nodeName = "Spawner";

  static initialElementProps = {
    initialScale: "fit",
    src: "https://sketchfab.com/models/a4c500d7358a4a199b6a5cd35f416466"
  };

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    const { src, applyGravity } = json.components.find(c => c.name === "spawner").props;

    node.applyGravity = !!applyGravity;

    loadAsync(node.load(src, onError));

    return node;
  }

  constructor(editor) {
    super(editor);
    this._canonicalUrl = "";
    this.initialScale = 1;
    this.boundingBox = new Box3();
    this.boundingSphere = new Sphere();
    this.stats = defaultStats;
    this.gltfJson = null;
    this.applyGravity = false;
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

    this.updateAttribution();

    return cloneObject3D(scene);
  }

  // Overrides Model's load method and resolves the src url before loading.
  async load(src, onError) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl && nextSrc !== "") {
      return;
    }

    this._canonicalUrl = nextSrc;

    this.stats = defaultStats;
    this.gltfJson = null;
    this.issues = [];

    if (this.model) {
      this.remove(this.model);
      this.editor.renderer.removeBatchedObject(this.model);
      this.model = null;
    }

    this.hideErrorIcon();
    this.showLoadingCube();

    try {
      const { accessibleUrl, files, meta } = await this.editor.api.resolveMedia(src);

      this.meta = meta;

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

      if (files) {
        // Revoke any object urls from the SketchfabZipLoader.
        for (const key in files) {
          if (Object.prototype.hasOwnProperty.call(files, key)) {
            URL.revokeObjectURL(files[key].url);
          }
        }
      }
    } catch (error) {
      this.showErrorIcon();

      const spawnerError = new RethrownError(`Error loading spawner model "${this._canonicalUrl}"`, error);

      if (onError) {
        onError(this, spawnerError);
      }

      console.error(spawnerError);

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

  serialize() {
    return super.serialize({
      spawner: {
        src: this._canonicalUrl,
        applyGravity: this.applyGravity
      }
    });
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    if (source.loadingCube) {
      this.initialScale = source.initialScale;
      this.load(source.src);
    } else {
      this.stats = JSON.parse(JSON.stringify(source.stats));
      this.gltfJson = source.gltfJson;
      this._canonicalUrl = source._canonicalUrl;
    }

    this.applyGravity = source.applyGravity;

    return this;
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("spawner", {
      src: this._canonicalUrl,
      mediaOptions: {
        applyGravity: this.applyGravity
      }
    });
    this.replaceObject();
  }

  getRuntimeResourcesForStats() {
    if (this.model) {
      const meshes = [];

      this.model.traverse(object => {
        if (object.isMesh) {
          meshes.push(object);
        }
      });

      const materials = collectUniqueMaterials(this.model);

      return { meshes, materials };
    }
  }
}
