import { AudioType, DistanceModelType, SourceType } from "../objects/AudioParams";
import EditorNodeMixin from "./EditorNodeMixin";

export default function AudioParamsNode(Type) {
  return class extends EditorNodeMixin(Type) {
    static async deserialize(editor, json) {
      const node = await super.deserialize(editor, json);

      const audioParamsProps = json.components.find(c => c.name === "audio-params").props;

      node.overrideAudioSettings =
        audioParamsProps.overrideAudioSettings === undefined ? true : audioParamsProps.overrideAudioSettings;
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

    constructor(editor, listener, type) {
      super(editor, listener, type);

      this._overrideAudioSettings = false;
    }

    get overrideAudioSettings() {
      return this._overrideAudioSettings;
    }

    set overrideAudioSettings(overriden) {
      this._overrideAudioSettings = overriden;
      if (!overriden) {
        this.modifiedProperties = {};
      }
    }

    copy(source, recursive = true) {
      super.copy(source, recursive);

      this._overrideAudioSettings = source._overrideAudioSettings;

      return this;
    }

    serialize(components) {
      return super.serialize({
        ...components,
        ...{
          "audio-params": {
            overrideAudioSettings: this.overrideAudioSettings,
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
        }
      });
    }

    prepareForExport() {
      if (this.overrideAudioSettings) {
        const audioType = this.exportPropertyValue("audio-params", "audioType");
        const gain = this.exportPropertyValue("audio-params", "gain");
        let distanceModel = this.exportPropertyValue("audio-params", "distanceModel");
        let rolloffFactor = this.exportPropertyValue("audio-params", "rolloffFactor");
        if (this.sourcetype === SourceType.MEDIA_VIDEO) {
          // We don't want artificial distance based attenuation to be applied to media stereo audios
          // so we set the distanceModel and rolloffFactor so the attenuation is always 1.
          distanceModel = this.exportPropertyValue[("audio-params", "distanceModel")]
            ? this.audioType === AudioType.Stereo
              ? DistanceModelType.Linear
              : this.exportPropertyValue("audio-params", "distanceModel")
            : undefined;
          rolloffFactor = this.exportPropertyValue[("audio-params", "rolloffFactor")]
            ? this.audioType === AudioType.Stereo
              ? 0
              : this.exportPropertyValue("audio-params", "rolloffFactor")
            : undefined;
        }
        const refDistance = this.exportPropertyValue("audio-params", "refDistance");
        const maxDistance = this.exportPropertyValue("audio-params", "maxDistance");
        const coneInnerAngle = this.exportPropertyValue("audio-params", "coneInnerAngle");
        const coneOuterAngle = this.exportPropertyValue("audio-params", "coneOuterAngle");
        const coneOuterGain = this.exportPropertyValue("audio-params", "coneOuterGain");

        this.addGLTFComponent("audio-params", {
          ...(audioType !== undefined && { audioType }),
          ...(gain !== undefined && { gain }),
          ...(distanceModel !== undefined && { distanceModel }),
          ...(rolloffFactor !== undefined && { rolloffFactor }),
          ...(refDistance !== undefined && { refDistance }),
          ...(maxDistance !== undefined && { maxDistance }),
          ...(coneInnerAngle !== undefined && { coneInnerAngle }),
          ...(coneOuterAngle !== undefined && { coneOuterAngle }),
          ...(coneOuterGain !== undefined && { coneOuterGain })
        });
      }
    }
  };
}
