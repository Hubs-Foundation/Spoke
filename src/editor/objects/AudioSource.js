import { Audio, PositionalAudio } from "three";
import { RethrownError } from "../utils/errors";
import AudioParams, { AudioType } from "./AudioParams";

export default class AudioSource extends AudioParams {
  constructor(audioListener, type, ...args) {
    super(type, ...args);

    const el = document.createElement(type);
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.crossOrigin = "anonymous";
    el.loop = true;
    this.el = el;

    this._src = "";
    this.audioListener = audioListener;
    this.controls = true;

    this.initAudio(this.audioType);
  }

  get duration() {
    return this.el.duration;
  }

  get src() {
    return this.el.src;
  }

  set src(src) {
    this.load(src).catch(console.error);
  }

  get autoPlay() {
    return this.el.autoplay;
  }

  set autoPlay(value) {
    this.el.autoplay = value;
  }

  get loop() {
    return this.el.loop;
  }

  set loop(value) {
    this.el.loop = value;
  }

  get audioType() {
    return super.audioType;
  }

  set audioType(type) {
    super.audioType = type;

    if (type === this._audioType) return;

    this.initAudio(type);
  }

  get gain() {
    return super.gain;
  }

  set gain(value) {
    super.gain = value;

    if (this.audio) this.audio.gain.gain.value = value;
  }

  get distanceModel() {
    return super.distanceModel;
  }

  set distanceModel(value) {
    super.distanceModel = value;

    if (this.audioType === AudioType.PannerNode) {
      this.audio && this.audio.setDistanceModel(value);
    }
  }

  get rolloffFactor() {
    return super.rolloffFactor;
  }

  set rolloffFactor(value) {
    super.rolloffFactor = value;

    if (this.audioType === AudioType.PannerNode) {
      this.audio && this.audio.setRolloffFactor(value);
    }
  }

  get refDistance() {
    return super.refDistance;
  }

  set refDistance(value) {
    super.refDistance = value;

    if (this.audioType === AudioType.PannerNode) {
      this.audio && this.audio.setRefDistance(value);
    }
  }

  get maxDistance() {
    return super.maxDistance;
  }

  set maxDistance(value) {
    super.maxDistance = value;

    if (this.audioType === AudioType.PannerNode) {
      this.audio && this.audio.setMaxDistance(value);
    }
  }

  get coneInnerAngle() {
    return super.coneInnerAngle;
  }

  set coneInnerAngle(value) {
    super.coneInnerAngle = value;

    if (this.audioType === AudioType.PannerNode) {
      if (this.audio) this.audio.panner.coneInnerAngle = value;
    }
  }

  get coneOuterAngle() {
    return super.coneOuterAngle;
  }

  set coneOuterAngle(value) {
    super.coneOuterAngle = value;

    if (this.audioType === AudioType.PannerNode) {
      if (this.audio) this.audio.panner.coneOuterAngle = value;
    }
  }

  get coneOuterGain() {
    return super.coneOuterGain;
  }

  set coneOuterGain(value) {
    super.coneOuterGain = value;

    if (this.audioType === AudioType.PannerNode) {
      if (this.audio) this.audio.panner.coneOuterGain = value;
    }
  }

  loadMedia(src) {
    return new Promise((resolve, reject) => {
      this.el.src = src;

      let cleanup = null;

      const onLoadedData = () => {
        cleanup();
        resolve();
      };

      const onError = error => {
        cleanup();
        reject(new RethrownError(`Error loading video "${this.el.src}"`, error));
      };

      cleanup = () => {
        this.el.removeEventListener("loadeddata", onLoadedData);
        this.el.removeEventListener("error", onError);
      };

      this.el.addEventListener("loadeddata", onLoadedData);
      this.el.addEventListener("error", onError);
    });
  }

  async load(src) {
    await this.loadMedia(src);

    if (this.audioSource === undefined) {
      this.audioSource = this.audioListener.context.createMediaElementSource(this.el);
      this.audio.setNodeSource(this.audioSource);
    }

    return this;
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

    this.controls = source.controls;
    this.autoPlay = source.autoPlay;
    this.loop = source.loop;
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

  initAudio(type) {
    let audio;
    const oldAudio = this.audio;

    if (type === AudioType.PannerNode) {
      audio = new PositionalAudio(this.audioListener);
    } else {
      audio = new Audio(this.audioListener);
    }

    if (oldAudio) {
      audio.gain.gain.value = oldAudio.getVolume();

      if (this.audioSource) {
        oldAudio.disconnect();
      }

      this.remove(oldAudio);
    }

    if (this.audioSource) {
      audio.setNodeSource(this.audioSource);
    }

    this.audio = audio;
    this.add(audio);
  }
}
