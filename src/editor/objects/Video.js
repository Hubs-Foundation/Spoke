import {
  VideoTexture,
  LinearFilter,
  sRGBEncoding,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  SphereBufferGeometry,
  RGBAFormat
} from "three";
import { RethrownError } from "../utils/errors";
import Hls from "hls.js/dist/hls.light";
import isHLS from "../utils/isHLS";
import AudioSource from "./AudioSource";

export const VideoProjection = {
  Flat: "flat",
  Equirectangular360: "360-equirectangular"
};

export default class Video extends AudioSource {
  constructor(audioListener, sourceType) {
    super(audioListener, sourceType);

    this._videoTexture = new VideoTexture(this.el);
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

    this.hls = null;
  }

  loadVideo(src, contentType) {
    return new Promise((resolve, reject) => {
      const _isHLS = isHLS(src, contentType);

      if (_isHLS) {
        if (!this.hls) {
          this.hls = new Hls();
        }

        this.hls.loadSource(src);
        this.hls.attachMedia(this.el);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.hls.startLoad(-1);
        });
      } else {
        this.el.src = src;
      }

      let cleanup = null;

      const onLoadedMetadata = () => {
        cleanup();
        resolve(this._videoTexture);
      };

      const onError = error => {
        cleanup();
        reject(new RethrownError(`Error loading video "${this.el.src}"`, error));
      };

      cleanup = () => {
        this.el.removeEventListener("loadeddata", onLoadedMetadata);
        this.el.removeEventListener("error", onError);
      };

      if (_isHLS) {
        this.hls.on(Hls.Events.ERROR, onError);
      }
      this.el.addEventListener("loadeddata", onLoadedMetadata);
      this.el.addEventListener("error", onError);
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
    this._mesh.visible = false;

    this._texture = await this.loadVideo(src, contentType);

    this.onResize();

    if (this.audioSource === undefined) {
      this.audioSource = this.audioListener.context.createMediaElementSource(this.el);
      this.audio.setNodeSource(this.audioSource);
    }

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
      const ratio = (this.el.videoHeight || 1.0) / (this.el.videoWidth || 1.0);
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

    return this;
  }
}
