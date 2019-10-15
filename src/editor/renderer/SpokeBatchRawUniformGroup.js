import { Color, Matrix4, ClampToEdgeWrapping } from "three";
import { BatchRawUniformGroup } from "@mozillareality/three-batch-manager";

const DEFAULT_COLOR = new Color(1, 1, 1);
const HIDE_MATRIX = new Matrix4().makeScale(0, 0, 0);
const tempUvTransform = [0, 0, 0, 0];

function getVisibility(object) {
  let curObj = object;

  while (curObj && !curObj.isNode) {
    curObj = curObj.parent;
  }

  if (!curObj) {
    return false;
  }

  return curObj.visible;
}

export default class SpokeBatchRawUniformGroup extends BatchRawUniformGroup {
  meshAtlases = new Map();

  addMesh(mesh, atlas) {
    this.meshAtlases.set(mesh, atlas);
    return super.addMesh(mesh, atlas);
  }

  removeMesh(mesh, atlas) {
    this.meshAtlases.delete(mesh);
    return super.removeMesh(mesh, atlas);
  }

  update(_time) {
    for (let instanceId = 0; instanceId < this.meshes.length; instanceId++) {
      const mesh = this.meshes[instanceId];

      if (!mesh) {
        continue;
      }

      this.setInstanceTransform(instanceId, getVisibility(mesh) ? mesh.matrixWorld : HIDE_MATRIX);
      this.setInstanceColor(instanceId, mesh.material.color || DEFAULT_COLOR, mesh.material.opacity || 1);

      const material = mesh.material;
      const atlas = this.meshAtlases.get(mesh);
      if (atlas) {
        if (material.map) {
          const textureId = atlas.addTexture(material.map, tempUvTransform);
          if (textureId === undefined) {
            console.warn("Mesh could not be batched. Texture atlas full.");
            this.freeId(instanceId);
            return false;
          }
          this.setInstanceUVTransform(instanceId, tempUvTransform);
          this.setInstanceMapSettings(instanceId, textureId[0], material.map.wrapS, material.map.wrapT);
        } else {
          this.setInstanceUVTransform(instanceId, atlas.nullTextureTransform);
          this.setInstanceMapSettings(instanceId, atlas.nullTextureIndex[0], ClampToEdgeWrapping, ClampToEdgeWrapping);
        }
      }
    }
  }
}
