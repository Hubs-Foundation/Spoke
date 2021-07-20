import { Material, BoxBufferGeometry, Mesh, BoxHelper } from "three";
import AudioParams from "../objects/AudioParams";
import EditorNodeMixin from "./EditorNodeMixin";

const requiredProperties = ["enabled", "inOut", "outIn"];

export default class AudioZoneNode extends EditorNodeMixin(AudioParams) {
  static componentName = "audio-zone";

  static nodeName = "Audio Zone";

  static _geometry = new BoxBufferGeometry();

  static _material = new Material();

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const zoneProps = json.components.find(c => c.name === "audio-zone").props;

    node.enabled = zoneProps.enabled;
    node.inOut = zoneProps.inOut;
    node.outIn = zoneProps.outIn;

    const audioParamsProps = json.components.find(c => c.name === "audio-params").props;

    node.audioType = audioParamsProps.audioType;
    node.gain = audioParamsProps.gain;
    node.distanceModel = audioParamsProps.distanceModel;
    node.rolloffFactor = audioParamsProps.rolloffFactor;
    node.refDistance = audioParamsProps.refDistance;
    node.maxDistance = audioParamsProps.maxDistance;
    node.coneInnerAngle = audioParamsProps.coneInnerAngle;
    node.coneOuterAngle = audioParamsProps.coneOuterAngle;
    node.coneOuterGain = audioParamsProps.coneOuterGain;

    return node;
  }

  constructor(editor) {
    super(editor, editor.audioListener);

    const boxMesh = new Mesh(AudioZoneNode._geometry, AudioZoneNode._material);
    const box = new BoxHelper(boxMesh, 0x00ff00);
    box.layers.set(1);
    this.helper = box;
    this.add(box);
    this.enabled = true;
    this.inOut = true;
    this.outIn = true;
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.remove(this.helper);
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
    return super.serialize({
      "audio-zone": {
        enabled: this.enabled,
        inOut: this.inOut,
        outIn: this.outIn
      },
      "audio-params": {
        audioType: this.audioType,
        gain: this.gain,
        distanceModel: this.distanceModel,
        rolloffFactor: this.rolloffFactor,
        refDistance: this.refDistance,
        maxDistance: this.maxDistance,
        coneInnerAngle: this.coneInnerAngle,
        coneOuterAngle: this.coneOuterAngle,
        coneOuterGain: this.coneOuterGain
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);

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
    this.addGLTFComponent("audio-params", {
      audioType: this.audioType,
      gain: this.gain,
      distanceModel: this.distanceModel,
      rolloffFactor: this.rolloffFactor,
      refDistance: this.refDistance,
      maxDistance: this.maxDistance,
      coneInnerAngle: this.coneInnerAngle,
      coneOuterAngle: this.coneOuterAngle,
      coneOuterGain: this.coneOuterGain
    });
  }
}
