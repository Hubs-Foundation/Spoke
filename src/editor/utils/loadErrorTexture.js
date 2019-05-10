import THREE from "../../vendor/three";
import eventToMessage from "./eventToMessage";
import mediaErrorImageUrl from "../../assets/media-error.png";

let errorTexturePromise = null;

export default function loadErrorTexture() {
  if (errorTexturePromise) {
    return errorTexturePromise;
  }

  const texturePromise = new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      mediaErrorImageUrl,
      texture => {
        texture.format = THREE.RGBAFormat;
        texture.magFilter = THREE.NearestFilter;
        resolve(texture);
      },
      null,
      e => reject(`Error loading error image. ${eventToMessage(e)}`)
    );
  });

  errorTexturePromise = texturePromise;

  return errorTexturePromise;
}
