import THREE from "../../vendor/three";

export const VideoProjection = {
  Flat: "flat",
  Equirectangular360: "360-equirectangular"
};

export const AudioType = {
  Stereo: "stereo",
  PannerNode: "pannernode"
};

export const DistanceModelType = {
  Linear: "linear",
  Inverse: "inverse",
  Exponential: "exponential"
};

export default class Video extends THREE.Object3D {
  constructor(audioListener) {
    super();

    const videoEl = document.createElement("video");
    const texture = new THREE.VideoTexture(videoEl);
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    this._texture = texture;

    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial();
    material.map = texture;
    material.side = THREE.DoubleSide;
    this._mesh = new THREE.Mesh(geometry, material);
    this.add(this._mesh);
    this._projection = "flat";

    this._src = null;
    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("webkit-playsinline", "");
    videoEl.crossOrigin = "anonymous";
    this.videoEl = videoEl;

    this.audioListener = audioListener;

    this.controls = true;
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
    this.add(audio);
    this._audioType = type;
  }

  get volume() {
    return this.audio.getVolume();
  }

  set volume(value) {
    this.audio.gain.gain.value = value;
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

  get projection() {
    return this._projection;
  }

  set projection(projection) {
    const material = new THREE.MeshBasicMaterial();

    let geometry;

    if (projection === "360-equirectangular") {
      geometry = new THREE.SphereBufferGeometry(1, 64, 32);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1);
    } else {
      geometry = new THREE.PlaneGeometry();
      material.side = THREE.DoubleSide;
    }

    material.map = this._texture;

    this._projection = projection;

    // Replace existing mesh
    this.remove(this._mesh);
    this._mesh = new THREE.Mesh(geometry, material);
    this.add(this._mesh);
  }

  async load(src) {
    await this.loadVideo(src);

    this.onResize();

    this.audioSource = this.audioListener.context.createMediaElementSource(this.videoEl);
    this.audio.setNodeSource(this.audioSource);

    this._mesh.material.needsUpdate = true;

    return this;
  }

  onResize() {
    if (this.projection === VideoProjection.Flat) {
      const ratio = (this.videoEl.videoHeight || 1.0) / (this.videoEl.videoWidth || 1.0);
      const width = Math.min(1.0, 1.0 / ratio);
      const height = Math.min(1.0, ratio);
      this._mesh.scale.set(width, height, 1);
    }
  }

  clone(recursive) {
    return new this.constructor(this.audioListener).copy(this, recursive);
  }

  copy(source, recursive) {
    super.copy(source, false);

    for (const child of source.children) {
      if (recursive === true && (child !== source._mesh && child !== source.audio)) {
        this.add(child.clone());
      }
    }

    this.projection = source.projection;
    this.src = source.src;
    this.controls = source.controls;
    this.autoPlay = source.autoPlay;
    this.loop = source.loop;
    this.audioType = source.audioType;
    this.volume = source.volume;
    this.distanceModel = source.distanceModel;
    this.rolloffFactor = source.rolloffFactor;
    this.refDistance = source.refDistance;
    this.maxDistance = source.maxDistance;
    this.coneInnerAngle = source.coneInnerAngle;
    this.coneOuterAngle = source.coneOuterAngle;
    this.coneOuterGain = source.coneOuterGain;

    return this;
  }
}
