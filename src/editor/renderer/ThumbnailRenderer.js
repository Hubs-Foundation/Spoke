import { Scene, AmbientLight, DirectionalLight, PerspectiveCamera, Box3, Vector3 } from "three";
import { environmentMap } from "../utils/EnvironmentMap";
import { traverseMaterials } from "../utils/materials";
import { getCanvasBlob } from "../utils/thumbnails";
import makeRenderer from "./makeRenderer";

export default class ThumbnailRenderer {
  constructor() {
    this.renderer = makeRenderer(512, 512);
  }

  generateThumbnail = async (object, width = 256, height = 256) => {
    const scene = new Scene();
    scene.add(object);

    const light1 = new AmbientLight(0xffffff, 0.3);
    scene.add(light1);

    const light2 = new DirectionalLight(0xffffff, 0.8 * Math.PI);
    light2.position.set(0.5, 0, 0.866);
    scene.add(light2);

    const camera = new PerspectiveCamera();
    scene.add(camera);

    traverseMaterials(object, material => {
      if (material.isMeshStandardMaterial || material.isGLTFSpecularGlossinessMaterial) {
        material.envMap = environmentMap;
        material.needsUpdate = true;
      }
    });

    object.updateMatrixWorld();

    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3()).length();
    const center = box.getCenter(new Vector3());

    camera.near = size / 100;
    camera.far = size * 100;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    camera.position.copy(center);
    camera.position.x += size;
    camera.position.y += size / 2;
    camera.position.z += size;
    camera.lookAt(center);

    camera.layers.disable(1);

    this.renderer.setSize(width, height, true);
    this.renderer.render(scene, camera);

    const blob = await getCanvasBlob(this.renderer.domElement);

    return blob;
  };
}
