import THREE from "./three";
import { isStatic, computeAndSetStaticModes } from "./StaticMode";

function getBase64Image(img) {
  // Create an empty canvas element
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  // Copy the image contents to the canvas
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  // Get the data-URL formatted image
  // Firefox supports PNG and JPEG. You could check img.src to
  // guess the original format, but be aware the using "image/jpg"
  // will re-encode the image.
  const dataURL = canvas.toDataURL("image/png");

  return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

export function compareImages(a, b) {
  if (a && b) {
    return a.src === b.src || getBase64Image(a) === getBase64Image(b);
  }

  return a === b;
}

export function compareTextures(a, b) {
  if (a && b) {
    return (
      compareImages(a, b) &&
      a.wrapS === b.wrapS &&
      a.wrapT === b.wrapT &&
      a.magFilter === b.magFilter &&
      a.minFilter === b.minFilter
    );
  }

  return a === b;
}

export default class MeshCombinationGroup {
  static MaterialComparators = {
    MeshStandardMaterial: (a, b) => {
      return (
        a.opacity === b.opacity &&
        a.roughness === b.roughness &&
        a.metalness === b.metalness &&
        a.aoMapIntensity === b.aoMapIntensity &&
        a.normalScale.equals(b.normalScale) &&
        a.color.equals(b.color) &&
        a.emissive.equals(b.emissive) &&
        compareTextures(a.map, b.map) &&
        compareTextures(a.roughnessMap, b.roughnessMap) &&
        compareTextures(a.metalnessMap, b.metalnessMap) &&
        compareTextures(a.aoMap, b.aoMap) &&
        compareTextures(a.normalMap, b.normalMap) &&
        compareTextures(a.emissiveMap, b.emissiveMap)
      );
    }
  };

  static combineMeshes(rootObject) {
    computeAndSetStaticModes(rootObject);

    const meshCombinationGroups = [];

    rootObject.traverse(object => {
      if (isStatic(object) && object.isMesh) {
        let added = false;

        for (const group of meshCombinationGroups) {
          if (group.tryAdd(object)) {
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
      const combinedMesh = group.combine();

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
  }

  tryAdd(object) {
    if (!object.isMesh) {
      return false;
    }

    if (!object.geometry.isBufferGeometry) {
      return false;
    }

    const compareMaterial = MeshCombinationGroup.MaterialComparators[object.material.type];

    if (!(compareMaterial && compareMaterial(this.initialObject.material, object.material))) {
      return false;
    }

    const initialGeometryAttributes = Object.keys(this.initialObject.geometry.attributes);
    const curGeometryAttributes = Object.keys(object.geometry.attributes);

    if (initialGeometryAttributes.length !== curGeometryAttributes.length) {
      return false;
    }

    if (initialGeometryAttributes.some(attrName => curGeometryAttributes.indexOf(attrName) === -1)) {
      return false;
    }

    this.meshes.push(object);

    return true;
  }

  combine() {
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
