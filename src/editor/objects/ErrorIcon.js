import { Mesh, PlaneBufferGeometry, MeshBasicMaterial, DoubleSide } from "three";
import { TextureLoader, RGBAFormat, NearestFilter } from "three";
import eventToMessage from "../utils/eventToMessage";
import mediaErrorImageUrl from "../../assets/media-error.png";

let errorTexturePromise = null;
let errorTexture = null;

export default class ErrorIcon extends Mesh {
  static async load() {
    if (errorTexturePromise) {
      return errorTexturePromise;
    }

    errorTexturePromise = new Promise((resolve, reject) => {
      new TextureLoader().load(
        mediaErrorImageUrl,
        texture => {
          texture.format = RGBAFormat;
          texture.magFilter = NearestFilter;
          resolve(texture);
        },
        null,
        e => reject(`Error loading error image. ${eventToMessage(e)}`)
      );
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
