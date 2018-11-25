import THREE from "../../vendor/three";

export const AudioType = {
  Stereo: "stereo",
  PannerNode: "pannernode"
};

export const DistanceModelType = {
  Linear: "linear",
  Inverse: "inverse",
  Exponential: "exponential"
};

export default class Video extends THREE.Mesh {
  constructor(audioListener) {
    const videoEl = document.createElement("video");
    const texture = new THREE.VideoTexture(videoEl);
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial();
    material.map = texture;
    material.side = THREE.DoubleSide;
    super(geometry, material);

    this._src = null;
    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("webkit-playsinline", "");
    videoEl.crossOrigin = "anonymous";
    this.videoEl = videoEl;

    this.audioListener = audioListener;

    this.startTime = 0;
    this.endTime = null;
    this.audioType = AudioType.PannerNode;
  }

  get duration() {
    return this.videoEl.duration;
  }

  get src() {
    return this.videoEl.src;
  }

  set src(src) {
    this.load(src).catch(console.error);
  }

  get autoPlay() {
    return this.videoEl.autoplay;
  }

  set autoPlay(value) {
    this.videoEl.autoplay = value;
  }

  get loop() {
    return this.videoEl.loop;
  }

  set loop(value) {
    this.videoEl.loop = value;
  }

  get audioType() {
    return this._audioType;
  }

  set audioType(type) {
    let audio;

    if (type === AudioType.PannerNode) {
      audio = new THREE.PositionalAudio(this.audioListener);
    } else {
      audio = new THREE.Audio(this.audioListener);
    }

    if (this.audioSource) {
      audio.setNodeSource(this.audioSource);
    }

    this.audio = audio;
    this._audioType = type;
  }

  get volume() {
    return this.audio.getVolume();
  }

  set volume(value) {
    this.audio.setVolume(value);
  }

  get distanceModel() {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.getDistanceModel();
    }

    return null;
  }

  set distanceModel(value) {
    if (this.audioType === AudioType.PannerNode) {
      this.audio.setDistanceModel(value);
    }
  }

  get rolloffFactor() {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.getRolloffFactor();
    }

    return null;
  }

  set rolloffFactor(value) {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.setRolloffFactor(value);
    }
  }

  get refDistance() {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.getRefDistance();
    }

    return null;
  }

  set refDistance(value) {
    if (this.audioType === AudioType.PannerNode) {
      this.audio.setRefDistance(value);
    }
  }

  get maxDistance() {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.getMaxDistance();
    }

    return null;
  }

  set maxDistance(value) {
    if (this.audioType === AudioType.PannerNode) {
      this.audio.setMaxDistance(value);
    }
  }

  get coneInnerAngle() {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.panner.coneInnerAngle;
    }

    return null;
  }

  set coneInnerAngle(value) {
    if (this.audioType === AudioType.PannerNode) {
      this.audio.panner.coneInnerAngle = value;
    }
  }

  get coneOuterAngle() {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.panner.coneOuterAngle;
    }

    return null;
  }

  set coneOuterAngle(value) {
    if (this.audioType === AudioType.PannerNode) {
      this.audio.panner.coneOuterAngle = value;
    }
  }

  get coneOuterGain() {
    if (this.audioType === AudioType.PannerNode) {
      return this.audio.panner.coneOuterGain;
    }

    return null;
  }

  set coneOuterGain(value) {
    if (this.audioType === AudioType.PannerNode) {
      this.audio.panner.coneOuterGain = value;
    }
  }

  loadVideo(src) {
    return new Promise((resolve, reject) => {
      this.videoEl.src = src;
      this.videoEl.currentTime = this.startTime;

      let cleanup = null;

      const onLoadedMetadata = () => {
        cleanup();
        resolve();
      };

      const onError = e => {
        cleanup();
        reject(e);
      };

      cleanup = () => {
        this.videoEl.removeEventListener("loadedmetadata", onLoadedMetadata);
        this.videoEl.removeEventListener("error", onError);
      };

      this.videoEl.addEventListener("loadedmetadata", onLoadedMetadata);
      this.videoEl.addEventListener("error", onError);
    });
  }

  async load(src) {
    await this.loadVideo(src);

    this.audioSource = this.audioListener.context.createMediaElementSource(this.videoEl);
    this.audio.setNodeSource(this.audioSource);

    this.material.needsUpdate = true;

    return this;
  }

  update() {
    if (this.endTime && this.videoEl.currentTime >= this.endTime) {
      if (this.video.loop) {
        if (this.startTime) {
          this.videoEl.currentTime = this.startTime;
        } else {
          this.videoEl.currentTime = 0;
        }
      } else {
        this.videoEl.pause();
      }
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    this.src = source.src;
    this.autoPlay = source.autoPlay;
    this.loop = source.loop;
    this.startTime = source.startTime;
    this.endTime = source.endTime;
    this.audioType = source.audioType;
    this.volume = source.volume;
    this.distanceModel = source.distanceModel;
    this.rolloffFactor = source.rolloffFactor;
    this.refDistance = source.refDistance;
    this.maxDistance = source.maxDistance;
    this.coneInnerAngle = source.coneInnerAngle;
    this.coneOuterAngle = source.coneOuterAngle;
    this.coneOuterGain = source.coneOuterAngle;

    return this;
  }
}
