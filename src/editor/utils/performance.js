import { traverseGltfScene, traverseGltfSceneEarlyOut, getGLTFComponents } from "../gltf/moz-hubs-components";
import { PointLight, DirectionalLight, SpotLight, Texture } from "three";
import { forEachMaterial } from "./materials";
import { bytesToSize } from "../../ui/utils";

function calculateUncompressedMipmapedTextureSize(width, height) {
  if (width === 1 && height === 1) {
    return 4;
  }

  return (
    width * height * 4 +
    calculateUncompressedMipmapedTextureSize(Math.max(Math.floor(width / 2), 1), Math.max(Math.floor(height / 2), 1))
  );
}

function isVisible(components) {
  const visibleComponent = components && components["visible"];
  return visibleComponent ? visibleComponent.visible : true;
}

function isLight(components) {
  return components && (components["directional-light"] || components["point-light"] || components["spot-light"]);
}

function isLargeImage(width, height) {
  return width * height > 2048 * 2048;
}

export function isLargeTexture(texture) {
  const imageOrVideo = texture.image;

  if (!imageOrVideo) {
    return false;
  }

  const width = imageOrVideo.width || imageOrVideo.videoWidth;
  const height = imageOrVideo.height || imageOrVideo.videoHeight;

  return isLargeImage(width, height);
}

export function calculateTextureVRAM(texture) {
  const imageOrVideo = texture.image;

  if (!imageOrVideo) {
    return 0;
  }

  const width = imageOrVideo.width || imageOrVideo.videoWidth;
  const height = imageOrVideo.height || imageOrVideo.videoHeight;

  return calculateUncompressedMipmapedTextureSize(width, height);
}

const fileTypeSuggestedMaxSizes = {
  gltf: 10485760,
  image: 4194304,
  default: 4194304
};

export function maybeAddLargeFileIssue(type, fileSize, issues) {
  const suggestedMaxFileSize = fileTypeSuggestedMaxSizes[type] || fileTypeSuggestedMaxSizes.default;

  if (fileSize > suggestedMaxFileSize) {
    issues.push({
      severity: "warning",
      message: `Large file (${bytesToSize(fileSize)}). Suggested ${type} max file size is ${suggestedMaxFileSize}.`
    });
  }
}

export function getObjectPerfIssues(object, traverse = true) {
  const issues = [];

  let polygons = 0;
  let totalVRAM = 0;
  let largeTextures = 0;
  const uniqueMaterials = new Set();

  const getChildPerfIssues = child => {
    if (child.isMesh) {
      polygons += calculateMeshPolygons(child);

      forEachMaterial(child, material => {
        uniqueMaterials.add(material);
      });
    }
  };

  if (traverse) {
    object.traverse(getChildPerfIssues);
  } else {
    getChildPerfIssues(object);
  }

  for (const material of uniqueMaterials) {
    if (material.map) {
      totalVRAM += calculateTextureVRAM(material.map);

      if (isLargeTexture(material.map)) {
        largeTextures++;
      }
    }

    if (material.aoMap) {
      totalVRAM += calculateTextureVRAM(material.aoMap);

      if (isLargeTexture(material.aoMap)) {
        largeTextures++;
      }
    }

    if (material.roughnessMap && material.roughnessMap !== material.aoMap) {
      totalVRAM += calculateTextureVRAM(material.roughnessMap);

      if (isLargeTexture(material.roughnessMap)) {
        largeTextures++;
      }
    }

    if (material.normalMap) {
      totalVRAM += calculateTextureVRAM(material.normalMap);

      if (isLargeTexture(material.normalMap)) {
        largeTextures++;
      }
    }

    if (material.emissiveMap) {
      totalVRAM += calculateTextureVRAM(material.emissiveMap);

      if (isLargeTexture(material.emissiveMap)) {
        largeTextures++;
      }
    }

    if (material.uniforms) {
      for (const name in material.uniforms) {
        if (!Object.prototype.hasOwnProperty.call(material.uniforms, name)) continue;

        const { value } = material.uniforms[name];

        if (value instanceof Texture) {
          totalVRAM += calculateTextureVRAM(value);

          if (isLargeTexture(material.value)) {
            largeTextures++;
          }
        }
      }
    }
  }

  if (polygons > 10000) {
    issues.push({ severity: "warning", message: `This object contains ${polygons.toLocaleString()} polygons.` });
  }

  if (uniqueMaterials > 10) {
    issues.push({ severity: "warning", message: `This object contains ${uniqueMaterials.size} unique materials.` });
  }

  if (largeTextures > 0) {
    issues.push({
      severity: "warning",
      message: `This object contains ${largeTextures} texture${largeTextures > 1 ? "s" : ""} larger than 2048 x 2048.`
    });
  }

  if (totalVRAM > 67108860) {
    issues.push({
      severity: "warning",
      message: `This object's textures use ~${bytesToSize(totalVRAM)} of video RAM.`
    });
  }

  return issues;
}

export function calculateMeshPolygons(mesh) {
  if (mesh.geometry.index) {
    return mesh.geometry.index.count / 3;
  } else {
    return mesh.geometry.attributes.position.count / 3;
  }
}

export function calculateGLTFPerformanceScores(scene, glbBlob, chunks) {
  // Calculate glTF scene cost
  const json = chunks.json;

  let polygons = 0;

  traverseGltfSceneEarlyOut(json, json.scene, node => {
    const components = getGLTFComponents(node);

    if (!isVisible(components)) {
      return false;
    }

    if (node.mesh !== undefined) {
      const mesh = json.meshes[node.mesh];

      if (mesh) {
        for (const primitive of mesh.primitives) {
          let count = 0;

          if (primitive.indices !== undefined) {
            const accessor = json.accessors[primitive.indices];
            count = (accessor && accessor.count) || 0;
          } else if (primitive.attributes.POSITION !== undefined) {
            const accessor = json.accessors[primitive.attributes.POSITION];
            count = (accessor && accessor.count) || 0;
          }

          switch (primitive.mode) {
            case 4:
              polygons += Math.round(count / 3);
              break;
            case 5:
            case 6:
              polygons += count > 2 ? count - 2 : 0;
              break;
            default:
              break;
          }
        }
      }
    }
  });

  let lights = 0;

  traverseGltfScene(json, json.scene, node => {
    const components = getGLTFComponents(node);

    if (isVisible(components) && isLight(components)) {
      lights++;
    }
  });

  let totalVRAM = 0;
  let largeTextures = 0;

  for (const { width, height } of chunks.images) {
    totalVRAM += calculateUncompressedMipmapedTextureSize(width, height);

    if (isLargeImage(width, height)) {
      largeTextures++;
    }
  }

  let uniqueMaterials = json.materials ? json.materials.length : 0;

  const fileSize = glbBlob.size;

  // Calculate runtime loaded costs

  const runtimeUniqueMaterials = new Set();
  const runtimeUniqueTextures = new Set();
  const runtimeMeshes = [];

  scene.traverse(object => {
    if (object.isNode && object.visible) {
      const results = object.getRuntimeResourcesForStats();

      if (!results) {
        return;
      }

      if (results.lights) {
        lights += results.lights.filter(
          light => light instanceof PointLight || light instanceof DirectionalLight || light instanceof SpotLight
        ).length;
      }

      if (results.materials) {
        results.materials.forEach(material => runtimeUniqueMaterials.add(material));
      }

      if (results.textures) {
        results.textures.forEach(texture => runtimeUniqueTextures.add(texture));
      }

      if (results.meshes) {
        runtimeMeshes.push(...results.meshes);
      }
    }
  });

  uniqueMaterials += runtimeUniqueMaterials.size;

  for (const texture of runtimeUniqueTextures) {
    totalVRAM += calculateTextureVRAM(texture);

    if (isLargeTexture(texture)) {
      largeTextures++;
    }
  }

  for (const mesh of runtimeMeshes) {
    polygons += calculateMeshPolygons(mesh);
  }

  // Calculate Scores

  let polygonsScore;

  if (polygons <= 50000) {
    polygonsScore = "Low";
  } else if (polygons <= 75000) {
    polygonsScore = "Medium";
  } else {
    polygonsScore = "High";
  }

  let lightsScore;

  if (lights <= 3) {
    lightsScore = "Low";
  } else if (lights <= 6) {
    lightsScore = "Medium";
  } else {
    lightsScore = "High";
  }

  let texturesScore;

  if (totalVRAM <= 268435500) {
    texturesScore = "Low";
  } else if (totalVRAM <= 536870900) {
    texturesScore = "Medium";
  } else {
    texturesScore = "High";
  }

  const largeTexturesScore = largeTextures > 0 ? "High" : "Low";

  let materialsScore;

  if (uniqueMaterials <= 25) {
    materialsScore = "Low";
  } else if (uniqueMaterials <= 50) {
    materialsScore = "Medium";
  } else {
    materialsScore = "High";
  }

  let fileSizeScore;

  if (fileSize < 16777220) {
    fileSizeScore = "Low";
  } else if (fileSize < 52428800) {
    fileSizeScore = "Medium";
  } else {
    fileSizeScore = "High";
  }

  return {
    polygons: {
      value: polygons,
      score: polygonsScore
    },
    textures: {
      value: totalVRAM,
      score: texturesScore,
      largeTexturesValue: largeTextures,
      largeTexturesScore
    },
    lights: {
      value: lights,
      score: lightsScore
    },
    materials: {
      value: uniqueMaterials,
      score: materialsScore
    },
    fileSize: {
      value: fileSize,
      score: fileSizeScore
    }
  };
}
