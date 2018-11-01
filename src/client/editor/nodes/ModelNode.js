import THREE from "../three";
import Model from "../objects/Model";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes } from "../StaticMode";

export default class ModelNode extends EditorNodeMixin(Model) {
  static nodeName = "Model";

  static shouldDeserialize(entityJson) {
    const gltfModelComponent = entityJson.components.find(c => c.name === "gltf-model");
    const navMeshComponent = entityJson.components.find(c => c.name === "nav-mesh");
    return gltfModelComponent && !navMeshComponent;
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { src, attribution, origin, includeInFloorPlan } = json.components.find(c => c.name === "gltf-model").props;

    await node.loadGLTF(editor, src);

    node.attribution = attribution;
    node.origin = origin;
    node.includeInFloorPlan = includeInFloorPlan;

    const loopAnimationComponent = json.components.find(c => c.name === "loop-animation");

    if (loopAnimationComponent && loopAnimationComponent.props.clip) {
      node.activeClip = loopAnimationComponent.props.clip;
    }

    return node;
  }

  constructor() {
    super();
    this.src = null;
    this.attribution = null;
    this.origin = null;
    this.includeInFloorPlan = true;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "gltf-model",
      props: {
        src: this.src,
        attribution: this.attribution,
        origin: this.origin,
        includeInFloorPlan: this.includeInFloorPlan
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
    this.src = source.src;
    this.attribution = source.attribution;
    this.origin = source.origin;
    this.includeInFloorPlan = source.includeInFloorPlan;
    return this;
  }

  async loadGLTF(editor, src) {
    const { scene, animations } = await editor.loadGLTF(new URL(src, editor.sceneUri).href);
    this.src = src;
    this.setModel(scene, animations);
    return this;
  }

  setModel(model, animations) {
    super.setModel(model, animations);

    if (!this.model) {
      return;
    }

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

  prepareForExport() {
    // TODO: Support exporting more than one active clip.
    if (this.clipActions.length > 0) {
      this.userData.gltfExtensions = {
        "loop-animation": {
          clip: this.clipActions[0].getClip().name
        }
      };
    }
  }
}
