import { Object3D } from "three";

export const SourceType = Object.freeze({
  MEDIA_VIDEO: 0,
  AVATAR_AUDIO_SOURCE: 1,
  AVATAR_RIG: 2,
  AUDIO_TARGET: 3,
  AUDIO_ZONE: 4
});

export const AudioType = Object.freeze({
  Stereo: "stereo",
  PannerNode: "pannernode"
});

export const DistanceModelType = Object.freeze({
  Linear: "linear",
  Inverse: "inverse",
  Exponential: "exponential"
});

export const AudioParamsDefaults = Object.freeze({
  DISTANCE_MODEL: DistanceModelType.Inverse,
  ROLLOFF_FACTOR: 1,
  REF_DISTANCE: 1,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 360,
  OUTER_ANGLE: 0,
  OUTER_GAIN: 0,
  GAIN: 0.5
});

export const AvatarAudioParamsDefaults = Object.freeze({
  DISTANCE_MODEL: DistanceModelType.Inverse,
  ROLLOFF_FACTOR: 2,
  REF_DISTANCE: 1,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 180,
  OUTER_ANGLE: 360,
  OUTER_GAIN: 0,
  VOLUME: 1.0
});

export const MediaAudioParamsDefaults = Object.freeze({
  DISTANCE_MODEL: DistanceModelType.Inverse,
  ROLLOFF_FACTOR: 1,
  REF_DISTANCE: 1,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 360,
  OUTER_ANGLE: 0,
  OUTER_GAIN: 0,
  VOLUME: 0.5
});

export const AudioTypeOptions = Object.values(AudioType).map(v => ({ label: v, value: v }));

export const DistanceModelOptions = Object.values(DistanceModelType).map(v => ({ label: v, value: v }));

export default class AudioParams extends Object3D {
  constructor() {
    super();

    this.audioType = AudioType.PannerNode;
    this.gain = AudioParamsDefaults.GAIN;
    this.distanceModel = AudioParamsDefaults.DISTANCE_MODEL;
    this.rolloffFactor = AudioParamsDefaults.ROLLOFF_FACTOR;
    this.refDistance = AudioParamsDefaults.REF_DISTANCE;
    this.maxDistance = AudioParamsDefaults.MAX_DISTANCE;
    this.coneInnerAngle = AudioParamsDefaults.INNER_ANGLE;
    this.coneOuterAngle = AudioParamsDefaults.OUTER_ANGLE;
    this.coneOuterGain = AudioParamsDefaults.OUTER_GAIN;
  }

  get audioType() {
    return this._audioType;
  }

  set audioType(type) {
    this._audioType = type;
  }

  get gain() {
    return this._gain;
  }

  set gain(value) {
    this._gain = value;
  }

  get distanceModel() {
    return this._distanceModel;
  }

  set distanceModel(value) {
    this._distanceModel = value;
  }

  get rolloffFactor() {
    return this._rolloffFactor;
  }

  set rolloffFactor(value) {
    this._rolloffFactor = value;
  }

  get refDistance() {
    return this._refDistance;
  }

  set refDistance(value) {
    this._refDistance = value;
  }

  get maxDistance() {
    return this._maxDistance;
  }

  set maxDistance(value) {
    this._maxDistance = value;
  }

  get coneInnerAngle() {
    return this._coneInnerAngle;
  }

  set coneInnerAngle(value) {
    this._coneInnerAngle = value;
  }

  get coneOuterAngle() {
    return this._coneOuterAngle;
  }

  set coneOuterAngle(value) {
    this._coneOuterAngle = value;
  }

  get coneOuterGain() {
    return this._coneOuterGain;
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
