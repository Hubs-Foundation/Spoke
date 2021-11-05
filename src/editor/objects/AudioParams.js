// These enums need to be kept in sync with the ones in the Hubs client for consistency

import { Object3D } from "three";

export const SourceType = Object.freeze({
  MEDIA_VIDEO: 0,
  AVATAR_AUDIO_SOURCE: 1,
  // TODO: Fill in missing value (2)
  AUDIO_TARGET: 3,
  AUDIO_ZONE: 4
});

export const AudioType = {
  Stereo: "stereo",
  PannerNode: "pannernode"
};

export const DistanceModelType = {
  Linear: "linear",
  Inverse: "inverse",
  Exponential: "exponential"
};

export const AvatarAudioDefaults = Object.freeze({
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 5,
  refDistance: 5,
  maxDistance: 10000,
  coneInnerAngle: 180,
  coneOuterAngle: 360,
  coneOuterGain: 0.9,
  gain: 1.0
});

export const MediaAudioDefaults = Object.freeze({
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 5,
  refDistance: 5,
  maxDistance: 10000,
  coneInnerAngle: 360,
  coneOuterAngle: 0,
  coneOuterGain: 0.9,
  gain: 0.5
});

export const AudioZoneDefaults = Object.freeze({
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 1,
  refDistance: 1,
  maxDistance: 10000,
  coneInnerAngle: 360,
  coneOuterAngle: 0,
  coneOuterGain: 0,
  gain: 0.5
});

export const Defaults = {
  [SourceType.AVATAR_AUDIO_SOURCE]: AvatarAudioDefaults,
  [SourceType.MEDIA_VIDEO]: MediaAudioDefaults,
  [SourceType.AUDIO_ZONE]: AudioZoneDefaults
};

export const AudioElementType = Object.freeze({
  AUDIO: "audio",
  VIDEO: "video",
  AUDIO_ZONE: "audio-zone"
});

export const sourceTypeForElementType = {
  [AudioElementType.AUDIO]: SourceType.MEDIA_VIDEO,
  [AudioElementType.VIDEO]: SourceType.MEDIA_VIDEO,
  [AudioElementType.AUDIO_ZONE]: SourceType.AUDIO_ZONE
};

export const AudioTypeOptions = Object.values(AudioType).map(v => ({ label: v, value: v }));

export const DistanceModelOptions = Object.values(DistanceModelType).map(v => ({ label: v, value: v }));

export default class AudioParams extends Object3D {
  constructor(type, ...args) {
    super(...args);

    this.sourceType = sourceTypeForElementType[type];

    this.audioType = Defaults[this.sourceType].audioType;
    this.gain = Defaults[this.sourceType].gain;
    this.distanceModel = Defaults[this.sourceType].distanceModel;
    this.rolloffFactor = Defaults[this.sourceType].rolloffFactor;
    this.refDistance = Defaults[this.sourceType].refDistance;
    this.maxDistance = Defaults[this.sourceType].maxDistance;
    this.coneInnerAngle = Defaults[this.sourceType].coneInnerAngle;
    this.coneOuterAngle = Defaults[this.sourceType].coneOuterAngle;
    this.coneOuterGain = Defaults[this.sourceType].coneOuterGain;
  }

  get audioType() {
    return this._audioType !== undefined ? this._audioType : Defaults[this.sourceType].audioType;
  }

  set audioType(type) {
    this._audioType = type;
  }

  get gain() {
    return this._gain !== undefined ? this._gain : Defaults[this.sourceType].gain;
  }

  set gain(value) {
    this._gain = value;
  }

  get distanceModel() {
    return this._distanceModel !== undefined ? this._distanceModel : Defaults[this.sourceType].distanceModel;
  }

  set distanceModel(value) {
    this._distanceModel = value;
  }

  get rolloffFactor() {
    return this._rolloffFactor !== undefined ? this._rolloffFactor : Defaults[this.sourceType].rolloffFactor;
  }

  set rolloffFactor(value) {
    this._rolloffFactor = value;
  }

  get refDistance() {
    return this._refDistance !== undefined ? this._refDistance : Defaults[this.sourceType].refDistance;
  }

  set refDistance(value) {
    this._refDistance = value;
  }

  get maxDistance() {
    return this._maxDistance !== undefined ? this._maxDistance : Defaults[this.sourceType].maxDistance;
  }

  set maxDistance(value) {
    this._maxDistance = value;
  }

  get coneInnerAngle() {
    return this._coneInnerAngle !== undefined ? this._coneInnerAngle : Defaults[this.sourceType].coneInnerAngle;
  }

  set coneInnerAngle(value) {
    this._coneInnerAngle = value;
  }

  get coneOuterAngle() {
    return this._coneOuterAngle !== undefined ? this._coneOuterAngle : Defaults[this.sourceType].coneOuterAngle;
  }

  set coneOuterAngle(value) {
    this._coneOuterAngle = value;
  }

  get coneOuterGain() {
    return this._coneOuterGain !== undefined ? this._coneOuterGain : Defaults[this.sourceType].coneOuterGain;
  }

  set coneOuterGain(value) {
    this._coneOuterGain = value;
  }

  copy(source, recursive = true) {
    super.copy(source, false);

    if (recursive) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i];
        if (child !== source.audio) {
          this.add(child.clone());
        }
      }
    }

    this.audioType = source.audioType;
    this.gain = source.gain;
    this.distanceModel = source.distanceModel;
    this.rolloffFactor = source.rolloffFactor;
    this.refDistance = source.refDistance;
    this.maxDistance = source.maxDistance;
    this.coneInnerAngle = source.coneInnerAngle;
    this.coneOuterAngle = source.coneOuterAngle;
    this.coneOuterGain = source.coneOuterGain;
    this.src = source.src;

    return this;
  }
}
