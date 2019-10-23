import { Box3, Sphere } from "three";
import Model from "../objects/Model";
import EditorNodeMixin from "./EditorNodeMixin";
import cloneObject3D from "../utils/cloneObject3D";

export default class SpawnerNode extends EditorNodeMixin(Model) {
  static legacyComponentName = "spawner";

  static nodeName = "Spawner";

  static initialElementProps = {
    scaleToFit: true,
    src: "https://sketchfab.com/models/a4c500d7358a4a199b6a5cd35f416466"
  };

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    const { src } = json.components.find(c => c.name === "spawner").props;

    loadAsync(node.load(src));

    return node;
  }

  constructor(editor) {
    super(editor);
    this._canonicalUrl = "";
    this.scaleToFit = false;
    this.boundingBox = new Box3();
    this.boundingSphere = new Sphere();
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

    const { scene } = await loader.getDependency("gltf");

    return cloneObject3D(scene);
  }

  // Overrides Model's load method and resolves the src url before loading.
  async load(src) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl) {
      return;
    }

    this._canonicalUrl = nextSrc;

    if (this.model) {
      this.remove(this.model);
      this.editor.renderer.removeBatchedObject(this.model);
      this.model = null;
    }

    if (this.errorMesh) {
      this.remove(this.errorMesh);
      this.errorMesh = null;
    }

    this.showLoadingCube();

    try {
      const { accessibleUrl, files } = await this.editor.api.resolveMedia(src);

      if (this.model) {
        this.editor.renderer.removeBatchedObject(this.model);
      }

      await super.load(accessibleUrl);

      if (this.model) {
        this.editor.renderer.addBatchedObject(this.model);
      }

      if (this.scaleToFit) {
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
        this.scaleToFit = false;
      }

      this.editor.emit("objectsChanged", [this]);

      if (files) {
        // Revoke any object urls from the SketchfabZipLoader.
        for (const key in files) {
          URL.revokeObjectURL(files[key]);
        }
      }
    } catch (e) {
      console.error(e);
    }

    this.hideLoadingCube();

    if (!this.model) {
      return this;
    }

    this.model.traverse(object => {
      if (object.material && object.material.isMeshStandardMaterial) {
        object.material.envMap = this.editor.scene.environmentMap;
        object.material.needsUpdate = true;
      }
    });

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
        src: this._canonicalUrl
      }
    });
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    if (source.loadingCube) {
      this.scaleToFit = source.scaleToFit;
      this.load(source.src);
    } else {
      this._canonicalUrl = source._canonicalUrl;
    }

    return this;
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("spawner", {
      src: this._canonicalUrl
    });
    this.replaceObject();
  }
}
