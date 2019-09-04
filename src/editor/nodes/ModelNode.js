import { Box3, Sphere, PropertyBinding } from "three";
import Model from "../objects/Model";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes } from "../StaticMode";

export default class ModelNode extends EditorNodeMixin(Model) {
  static nodeName = "Model";

  static legacyComponentName = "gltf-model";

  static initialElementProps = {
    scaleToFit: true,
    src: "https://sketchfab.com/models/a4c500d7358a4a199b6a5cd35f416466"
  };

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    loadAsync(
      (async () => {
        const { src, attribution } = json.components.find(c => c.name === "gltf-model").props;

        await node.load(src);

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
    const gltf = await this.editor.gltfCache.get(src);

    const sketchfabExtras = gltf.asset && gltf.asset.extras;

    if (sketchfabExtras) {
      const name = sketchfabExtras.title;
      const author = sketchfabExtras.author.replace(/ \(http.+\)/, "");
      const url = sketchfabExtras.source || this._canonicalUrl;
      gltf.scene.name = name;
      this.attribution = { name, author, url };
    }

    return gltf;
  }

  // Overrides Model's load method and resolves the src url before loading.
  async load(src) {
    const nextSrc = src || "";

    if (nextSrc === this._canonicalUrl) {
      return;
    }

    this._canonicalUrl = nextSrc;
    this.attribution = null;

    if (this.model) {
      this.remove(this.model);
      this.model = null;
    }

    if (this.errorMesh) {
      this.remove(this.errorMesh);
      this.errorMesh = null;
    }

    this.showLoadingCube();

    try {
      const { accessibleUrl, files } = await this.editor.api.resolveMedia(src);

      await super.load(accessibleUrl);

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

      if (this.model) {
        this.model.traverse(object => {
          if (object.material && object.material.isMeshStandardMaterial) {
            object.material.envMap = this.editor.scene.environmentMap;
            object.material.needsUpdate = true;
          }
        });
      }

      this.updateStaticModes();

      this.editor.emit("objectsChanged", [this]);

      if (files) {
        // Revoke any object urls from the SketchfabZipLoader.
        // for (const key in files) {
        //   URL.revokeObjectURL(files[key]);
        // }
      }
    } catch (e) {
      console.error(e);
    }

    this.hideLoadingCube();

    if (!this.model) {
      return this;
    }

    return this;
  }

  updateStaticModes() {
    if (!this.model) return;

    setStaticMode(this.model, StaticModes.Static);

    if (this.model.animations.length > 0) {
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
      this.scaleToFit = source.scaleToFit;
      this.load(source.src);
    } else {
      this.updateStaticModes();
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
