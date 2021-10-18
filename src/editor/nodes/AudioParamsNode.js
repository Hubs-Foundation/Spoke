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
        let distanceModel = this.optionalPropertyExportValue("distanceModel");
        let rolloffFactor = this.optionalPropertyExportValue("rolloffFactor");
        if (this.sourcetype === SourceType.MEDIA_VIDEO) {
          // We don't want artificial distance based attenuation to be applied to media stereo audios
          // so we set the distanceModel and rolloffFactor so the attenuation is always 1.
          distanceModel = this.optionalPropertyExportValue["distanceModel"]
            ? this.audioType === AudioType.Stereo
              ? DistanceModelType.Linear
              : this.optionalPropertyExportValue("distanceModel")
            : undefined;
          rolloffFactor = this.optionalPropertyExportValue["rolloffFactor"]
            ? this.audioType === AudioType.Stereo
              ? 0
              : this.optionalPropertyExportValue("rolloffFactor")
            : undefined;
        }

        this.addGLTFComponent("audio-params", {
          audioType: this.optionalPropertyExportValue("audioType"),
          gain: this.optionalPropertyExportValue("gain"),
          distanceModel,
          rolloffFactor,
          refDistance: this.optionalPropertyExportValue("refDistance"),
          maxDistance: this.optionalPropertyExportValue("maxDistance"),
          coneInnerAngle: this.optionalPropertyExportValue("coneInnerAngle"),
          coneOuterAngle: this.optionalPropertyExportValue("coneOuterAngle"),
          coneOuterGain: this.optionalPropertyExportValue("coneOuterGain")
        });
      }
    }
  };
}
