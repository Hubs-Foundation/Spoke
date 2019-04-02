import THREE from "../../vendor/three";
import eventToMessage from "./eventToMessage";
import negx from "../../assets/cubemap/negx.jpg";
import negy from "../../assets/cubemap/negy.jpg";
import negz from "../../assets/cubemap/negz.jpg";
import posx from "../../assets/cubemap/posx.jpg";
import posy from "../../assets/cubemap/posy.jpg";
import posz from "../../assets/cubemap/posz.jpg";

let cubeMapTexturePromise = null;

export let environmentMap = null;

export function loadEnvironmentMap() {
  if (cubeMapTexturePromise) {
    return cubeMapTexturePromise;
  }

  cubeMapTexturePromise = new Promise((resolve, reject) => {
    const cubeMapURLs = [posx, negx, posy, negy, posz, negz];
    cubeMapTexturePromise = new THREE.CubeTextureLoader().load(
      cubeMapURLs,
      texture => {
        texture.format = THREE.RGBFormat;
        environmentMap = texture;
        resolve(texture);
      },
      null,
      e => reject(`Error loading cubemap image. ${eventToMessage(e)}`)
    );
  });

  return cubeMapTexturePromise;
}
