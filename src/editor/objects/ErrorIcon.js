import { Mesh, PlaneBufferGeometry, MeshBasicMaterial, DoubleSide } from "three";
import { RGBAFormat, NearestFilter } from "three";
import mediaErrorImageUrl from "../../assets/media-error.png";
import loadTexture from "../utils/loadTexture";

let errorTexturePromise = null;
let errorTexture = null;

export default class ErrorIcon extends Mesh {
  static async load() {
    if (errorTexturePromise) {
      return errorTexturePromise;
    }

    errorTexturePromise = loadTexture(mediaErrorImageUrl).then(texture => {
      texture.format = RGBAFormat;
      texture.magFilter = NearestFilter;
      return texture;
    });

    errorTexture = await errorTexturePromise;

    return errorTexture;
  }

  constructor() {
    if (!errorTexture) {
      throw new Error("ErrorIcon must be loaded before it can be used. Await ErrorIcon.load()");
    }

    const geometry = new PlaneBufferGeometry();
    const material = new MeshBasicMaterial();
    material.map = errorTexture;
    material.side = DoubleSide;
    material.transparent = true;
    super(geometry, material);

    this.name = "ErrorIcon";
    this.type = "ErrorIcon";
  }
}
