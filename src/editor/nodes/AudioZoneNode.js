import { Material, BoxBufferGeometry, Mesh, BoxHelper, Vector3, Quaternion } from "three";
import AudioParams, { AudioElementType } from "../objects/AudioParams";
import AudioParamsNode from "./AudioParamsNode";

const requiredProperties = ["enabled", "inOut", "outIn"];

export default class AudioZoneNode extends AudioParamsNode(AudioParams) {
  static componentName = "audio-zone";

  static nodeName = "Audio Zone";

  static _geometry = new BoxBufferGeometry();

  static _material = new Material();

  static optionalProperties = {
    "audio-params": [
      "audioType",
      "gain",
      "distanceModel",
      "rolloffFactor",
      "refDistance",
      "maxDistance",
      "coneInnerAngle",
      "coneOuterAngle",
      "coneOuterGain"
    ]
  };

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json, loadAsync, onError);

    const zoneProps = json.components.find(c => c.name === "audio-zone").props;

    node.enabled = zoneProps.enabled;
    node.inOut = zoneProps.inOut;
    node.outIn = zoneProps.outIn;

    return node;
  }

  constructor(editor) {
    super(editor, AudioElementType.AUDIO_ZONE);

    const boxMesh = new Mesh(AudioZoneNode._geometry, AudioZoneNode._material);
    const box = new BoxHelper(boxMesh, 0x00ff00);
    box.layers.set(1);
    this.helper = box;
    editor.scene.attach(box);
    this.enabled = true;
    this.inOut = true;
    this.outIn = true;
  }

  onUpdate() {
    const pos = new Vector3();
    const rot = new Quaternion();
    const scale = new Vector3();
    this.matrixWorld.decompose(pos, rot, scale);
    this.helper.position.copy(pos);
    this.helper.scale.copy(scale);
    this.helper.updateMatrix();
    this.helper.update();
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.editor.scene.remove(this.helper);
    }

    super.copy(source, recursive);

    if (recursive) {
      const helperIndex = source.children.indexOf(source.helper);

      if (helperIndex !== -1) {
        this.helper = this.children[helperIndex];
      }
    }

    this.enabled = source.enabled;
    this.inOut = source.inOut;
    this.outIn = source.outIn;

    return this;
  }

  serialize() {
    const json = super.serialize({
      "audio-zone": {
        enabled: this.enabled,
        inOut: this.inOut,
        outIn: this.outIn
      }
    });
    const transformComponent = json.components.find(c => c.name === "transform");
    const worldPos = new Vector3();
    const worldQuat = new Quaternion();
    const worldScale = new Vector3();
    this.helper.matrixWorld.decompose(worldPos, worldQuat, worldScale);
    const worldRot = new Vector3().applyQuaternion(worldQuat);
    transformComponent.props = {
      position: {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z
      },
      rotation: {
        x: worldRot.x,
        y: worldRot.y,
        z: worldRot.z
      },
      scale: {
        x: worldScale.x,
        y: worldScale.y,
        z: worldScale.z
      }
    };
    return json;
  }

  prepareForExport() {
    super.prepareForExport();
    this.editor.scene.remove(this.helper);

    for (const prop of requiredProperties) {
      if (this[prop] === null || this[prop] === undefined) {
        console.warn(`AudioZone: property "${prop}" is required. Skipping...`);
        return;
      }
    }

    this.addGLTFComponent("audio-zone", {
      target: this.gltfIndexForUUID(this.target),
      enabled: this.enabled,
      inOut: this.inOut,
      outIn: this.outIn
    });
  }
}
