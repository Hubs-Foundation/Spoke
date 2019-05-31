import { TextureLoader, RGBAFormat, NearestFilter } from "three";
import eventToMessage from "./eventToMessage";
import mediaErrorImageUrl from "../../assets/media-error.png";

let errorTexturePromise = null;

export default function loadErrorTexture() {
  if (errorTexturePromise) {
    return errorTexturePromise;
  }

  const texturePromise = new Promise((resolve, reject) => {
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

  errorTexturePromise = texturePromise;

  return errorTexturePromise;
}
