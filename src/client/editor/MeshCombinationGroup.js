import THREE from "./three";
import { isStatic } from "./StaticMode";
import asyncTraverse from "./utils/asyncTraverse";
import keysEqual from "./utils/keysEqual";
import hashImage from "./utils/hashImage";

export async function getImageHash(hashCache, img) {
  let hash = hashCache.get(img);

  if (!hash) {
    hash = await hashImage(img);
    hashCache.set(img, hash);
  }

  return hash;
}

export async function compareImages(hashCache, a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return (await getImageHash(hashCache, a)) === (await getImageHash(hashCache, b));
}

export async function compareTextures(hashCache, a, b) {
  if (a && b) {
    return (
      a.wrapS === b.wrapS &&
      a.wrapT === b.wrapT &&
      a.magFilter === b.magFilter &&
      a.minFilter === b.minFilter &&
      (await compareImages(hashCache, a.image, b.image))
    );
  }

  return a === b;
}

export default class MeshCombinationGroup {
  static MaterialComparators = {
    MeshStandardMaterial: async (group, a, b) => {
      const imageHashes = group.imageHashes;

      return (
        a.opacity === b.opacity &&
        a.roughness === b.roughness &&
        a.metalness === b.metalness &&
        a.aoMapIntensity === b.aoMapIntensity &&
        a.normalScale.equals(b.normalScale) &&
        a.color.equals(b.color) &&
        a.emissive.equals(b.emissive) &&
        (await compareTextures(imageHashes, a.map, b.map)) &&
        (await compareTextures(imageHashes, a.roughnessMap, b.roughnessMap)) &&
        (await compareTextures(imageHashes, a.metalnessMap, b.metalnessMap)) &&
        (await compareTextures(imageHashes, a.aoMap, b.aoMap)) &&
        (await compareTextures(imageHashes, a.normalMap, b.normalMap)) &&
        (await compareTextures(imageHashes, a.emissiveMap, b.emissiveMap))
      );
    }
  };

  static async combineMeshes(rootObject) {
    rootObject.computeAndSetStaticModes();

    const meshCombinationGroups = [];

    await asyncTraverse(rootObject, async object => {
      if (isStatic(object) && object.isMesh) {
        let added = false;

        for (const group of meshCombinationGroups) {
          if (await group._tryAdd(object)) {
            added = true;
            break;
          }
        }

        if (!added) {
          meshCombinationGroups.push(new MeshCombinationGroup(object));
        }
      }
    });

    for (const group of meshCombinationGroups) {
      const combinedMesh = group._combine();

      if (combinedMesh) {
        rootObject.add(combinedMesh);
      }
    }

    return rootObject;
  }

  constructor(initialObject) {
    if (!initialObject.isMesh) {
      throw new Error("MeshCombinationGroup must be initialized with a THREE.Mesh.");
    }

    this.initialObject = initialObject;
    this.meshes = [initialObject];
    this.imageHashes = new Map();
  }

  async _tryAdd(object) {
    if (!object.isMesh) {
      return false;
    }

    if (!object.geometry.isBufferGeometry) {
      return false;
    }

    const compareMaterial = MeshCombinationGroup.MaterialComparators[object.material.type];

    if (!(compareMaterial && (await compareMaterial(this, this.initialObject.material, object.material)))) {
      return false;
    }

    if (!keysEqual(this.initialObject.geometry.attributes, object.geometry.attributes)) {
      return false;
    }

    this.meshes.push(object);

    return true;
  }

  _combine() {
    const originalMesh = this.meshes[0];

    if (this.meshes.length === 1) {
      return null;
    }

    const bufferGeometries = [];

    for (const mesh of this.meshes) {
      // Clone buffer geometry in case it is re-used across meshes with different materials.
      const clonedBufferGeometry = mesh.geometry.clone();
      clonedBufferGeometry.applyMatrix(mesh.matrixWorld);
      bufferGeometries.push(clonedBufferGeometry);
      mesh.parent.remove(mesh);
    }

    const combinedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(bufferGeometries);
    delete combinedGeometry.userData.mergedUserData;
    const combinedMesh = new THREE.Mesh(combinedGeometry, originalMesh.material);
    combinedMesh.name = "CombinedMesh";
    combinedMesh.receiveShadow = originalMesh.receiveShadow;
    combinedMesh.castShadow = originalMesh.castShadow;

    return combinedMesh;
  }
}
