import THREE from "../../vendor/three";
import Model from "../objects/Model";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes } from "../StaticMode";
import absoluteToRelativeURL from "../utils/absoluteToRelativeURL";

export default class ModelNode extends EditorNodeMixin(Model) {
  static nodeName = "Model";

  static shouldDeserialize(entityJson) {
    const gltfModelComponent = entityJson.components.find(c => c.name === "gltf-model");
    const navMeshComponent = entityJson.components.find(c => c.name === "nav-mesh");
    return gltfModelComponent && !navMeshComponent;
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { src, attribution, includeInFloorPlan, origin } = json.components.find(c => c.name === "gltf-model").props;

    let absoluteURL = new URL(src, editor.sceneUri).href;

    if (origin) {
      absoluteURL = origin;
    }

    await node.load(absoluteURL);

    // Legacy, might be a raw string left over before switch to JSON.
    if (attribution && typeof attribution === "string") {
      const [name, author] = attribution.split(" by ");
      node.attribution = { name, author };
    } else {
      node.attribution = attribution;
    }

    node.includeInFloorPlan = includeInFloorPlan === undefined ? true : includeInFloorPlan;

    const loopAnimationComponent = json.components.find(c => c.name === "loop-animation");

    if (loopAnimationComponent && loopAnimationComponent.props.clip) {
      node.activeClipName = loopAnimationComponent.props.clip;
    }

    const shadowComponent = json.components.find(c => c.name === "shadow");

    if (shadowComponent) {
      node.castShadow = shadowComponent.props.cast;
      node.receiveShadow = shadowComponent.props.receive;
    }

    return node;
  }

  constructor(editor) {
    super(editor);
    this.attribution = null;
    this.includeInFloorPlan = true;
    this._canonicalUrl = null;
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

    if (!this.attribution && sketchfabExtras) {
      const name = sketchfabExtras && sketchfabExtras.title;
      const author = sketchfabExtras && sketchfabExtras.author.replace(/ \(http.+\)/, "");
      gltf.scene.name = name;
      this.attribution = { name, author, url: this._canonicalUrl };
    }

    return gltf;
  }

  // Overrides Model's load method and resolves the src url before loading.
  async load(src) {
    this._canonicalUrl = src;

    const { accessibleUrl, files } = await this.editor.project.resolveMedia(src);

    await super.load(accessibleUrl);

    if (files) {
      // Revoke any object urls from the SketchfabZipLoader.
      for (const key in files) {
        URL.revokeObjectURL(files[key]);
      }
    }

    if (!this.model) {
      return this;
    }

    this.updateStaticModes();

    this.model.traverse(object => {
      if (object.material && object.material.isMeshStandardMaterial) {
        object.material.envMap = this.editor.scene.environmentMap;
        object.material.needsUpdate = true;
      }
    });

    return this;
  }

  updateStaticModes() {
    setStaticMode(this.model, StaticModes.Static);

    if (this.animations.length > 0) {
      for (const animation of this.animations) {
        for (const track of animation.tracks) {
          const { nodeName } = THREE.PropertyBinding.parseTrackName(track.name);
          const animatedNode = this.model.getObjectByName(nodeName);
          setStaticMode(animatedNode, StaticModes.Dynamic);
        }
      }
    }
  }

  serialize(sceneUri) {
    const json = super.serialize();

    json.components.push({
      name: "gltf-model",
      props: {
        src: absoluteToRelativeURL(sceneUri, this._canonicalUrl),
        attribution: this.attribution,
        includeInFloorPlan: this.includeInFloorPlan
      }
    });

    json.components.push({
      name: "shadow",
      props: {
        cast: this.castShadow,
        receive: this.receiveShadow
      }
    });

    if (this.clipActions.length > 0) {
      json.components.push({
        name: "loop-animation",
        props: {
          clip: this.clipActions[0].getClip().name
        }
      });
    }

    return json;
  }

  copy(source, recursive) {
    super.copy(source, recursive);
    this.updateStaticModes();
    this._canonicalUrl = source._canonicalUrl;
    this.attribution = source.attribution;
    this.includeInFloorPlan = source.includeInFloorPlan;
    return this;
  }

  prepareForExport() {
    this.userData.gltfExtensions = {
      HUBS_components: {
        shadow: {
          cast: this.castShadow,
          receive: this.receiveShadow
        }
      }
    };

    // TODO: Support exporting more than one active clip.
    if (this.clipActions.length > 0) {
      this.userData.gltfExtensions.HUBS_components["loop-animation"] = {
        clip: this.clipActions[0].getClip().name
      };
    }
  }
}
