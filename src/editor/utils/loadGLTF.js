import THREE from "../../vendor/three";
import eventToMessage from "./eventToMessage";
import { mapMaterials } from "./materials";
import MobileStandardMaterial from "../materials/MobileStandardMaterial";
import { quality } from "./queryparams";

const useMobileMaterial = quality === "low";

export default async function loadGLTF(url, options) {
  const loader = new THREE.GLTFLoader();

  if (options) {
    Object.assign(loader, options);
  }

  const gltf = await new Promise((resolve, reject) =>
    loader.load(url, resolve, undefined, e => {
      reject(new Error(`Error loading glTF model with url: ${url}. ${eventToMessage(e)}`));
    })
  );

  if (gltf.scene && useMobileMaterial) {
    gltf.scene.traverse(object3D => {
      mapMaterials(object3D, material => {
        if (material.isMeshStandardMaterial) {
          return MobileStandardMaterial.fromStandardMaterial(material);
        } else {
          return material;
        }
      });
    });
  }

  return gltf;
}
