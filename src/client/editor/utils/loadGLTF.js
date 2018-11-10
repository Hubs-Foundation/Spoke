import THREE from "../../vendor/three";

export default function loadGLTF(src) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    loader.load(
      src,
      gltf => {
        resolve(gltf);
      },
      null,
      reject
    );
  });
}
