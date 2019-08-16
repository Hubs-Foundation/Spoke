import {
  Object3D,
  VideoTexture,
  LinearFilter,
  sRGBEncoding,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  PositionalAudio,
  Audio,
  SphereBufferGeometry,
  RGBAFormat
} from "three";
import eventToMessage from "../utils/eventToMessage";
import Hls from "hls.js/dist/hls.light";
import isHLS from "../utils/isHLS";
import loadErrorTexture from "../utils/loadErrorTexture";

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

export default class Video extends Object3D {
  constructor(audioListener) {
    super();

    const videoEl = document.createElement("video");
    this._videoTexture = new VideoTexture(videoEl);
    this._videoTexture.minFilter = LinearFilter;
    this._videoTexture.encoding = sRGBEncoding;
    this._texture = this._videoTexture;

    const geometry = new PlaneBufferGeometry();
    const material = new MeshBasicMaterial();
    material.map = this._texture;
    material.side = DoubleSide;
    this._mesh = new Mesh(geometry, material);
    this._mesh.name = "VideoMesh";
    this.add(this._mesh);
    this._projection = "flat";

    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("webkit-playsinline", "");
    videoEl.crossOrigin = "anonymous";
    videoEl.loop = true;
    this.videoEl = videoEl;

    this.audioListener = audioListener;

    this.controls = true;
    this.audioType = AudioType.PannerNode;

    this.hls = null;
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
    if (type === this._audioType) return;

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

  loadVideo(src, contentType) {
    return new Promise((resolve, reject) => {
      const _isHLS = isHLS(src, contentType);

      if (_isHLS) {
        if (!this.hls) {
          this.hls = new Hls();
        }

        this.hls.loadSource(src);
        this.hls.attachMedia(this.videoEl);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.hls.startLoad(-1);
        });
      } else {
        this.videoEl.src = src;
      }

      let cleanup = null;

      const onLoadedMetadata = () => {
        cleanup();
        resolve(this._videoTexture);
      };

      const onError = e => {
        cleanup();
        reject(new Error(`Video "${this.videoEl.src}" failed to load. ${eventToMessage(e)}`));
      };

      cleanup = () => {
        this.videoEl.removeEventListener("loadeddata", onLoadedMetadata);
        this.videoEl.removeEventListener("error", onError);
      };

      if (_isHLS) {
        this.hls.on(Hls.Events.ERROR, onError);
      }
      this.videoEl.addEventListener("loadeddata", onLoadedMetadata);
      this.videoEl.addEventListener("error", onError);
    });
  }

  get projection() {
    return this._projection;
  }

  set projection(projection) {
    if (projection === this._projection) {
      return;
    }

    const material = new MeshBasicMaterial();

    let geometry;

    if (projection === "360-equirectangular") {
      geometry = new SphereBufferGeometry(1, 64, 32);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1);
    } else {
      geometry = new PlaneBufferGeometry();
      material.side = DoubleSide;
    }

    material.map = this._texture;

    this._projection = projection;

    const nextMesh = new Mesh(geometry, material);
    nextMesh.name = "VideoMesh";

    const meshIndex = this.children.indexOf(this._mesh);

    if (meshIndex === -1) {
      this.add(nextMesh);
    } else {
      this.children.splice(meshIndex, 1, nextMesh);
      nextMesh.parent = this;
    }

    this._mesh = nextMesh;

    this.onResize();
  }

  async load(src, contentType) {
    let texture;

    this._mesh.visible = false;

    try {
      if (src) {
        texture = await this.loadVideo(src, contentType);
      } else {
        texture = await loadErrorTexture();
      }
    } catch (err) {
      texture = await loadErrorTexture();
      console.warn(`Error loading video node with src: "${src}": "${err.message || "unknown error"}"`);
    }

    this._texture = texture;

    this.onResize();

    this.audioSource = this.audioListener.context.createMediaElementSource(this.videoEl);
    this.audio.setNodeSource(this.audioSource);

    if (this._texture.format === RGBAFormat) {
      this._mesh.material.transparent = true;
    }

    this._mesh.material.map = this._texture;
    this._mesh.material.needsUpdate = true;
    this._mesh.visible = true;

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

  copy(source, recursive = true) {
    super.copy(source, false);

    if (recursive) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i];
        if (child !== source.audio && child !== source._mesh) {
          this.add(child.clone());
        }
      }
    }

    this.projection = source.projection;
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
    this.src = source.src;

    return this;
  }
}
