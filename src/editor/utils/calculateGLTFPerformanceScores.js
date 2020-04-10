import { traverseGltfScene, traverseGltfSceneEarlyOut, getGLTFComponents } from "../gltf/moz-hubs-components";

function calculateUncompressedMipmapedTextureSize(width, height) {
  if (width === 1 && height === 1) {
    return 4;
  }

  return (
    width * height * 4 +
    calculateUncompressedMipmapedTextureSize(Math.max(Math.floor(width / 2), 1), Math.max(Math.floor(height / 2), 1))
  );
}

export default function calculateGLTFPerformanceScores(glbBlob, chunks) {
  const json = chunks.json;

  let polygons = 0;

  traverseGltfSceneEarlyOut(json, json.scene, node => {
    const components = getGLTFComponents(node);

    if (components && (components["nav-mesh"] || components.trimesh)) {
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

  let polygonsScore;

  if (polygons <= 50000) {
    polygonsScore = "Low";
  } else if (polygons <= 75000) {
    polygonsScore = "Medium";
  } else {
    polygonsScore = "High";
  }

  let lights = 0;

  traverseGltfScene(json, json.scene, node => {
    const components = getGLTFComponents(node);

    if (components && (components["directional-light"] || components["point-light"] || components["spot-light"])) {
      lights++;
    }
  });

  let lightsScore;

  if (lights <= 3) {
    lightsScore = "Low";
  } else if (lights <= 6) {
    lightsScore = "Medium";
  } else {
    lightsScore = "High";
  }

  let totalVRAM = 0;
  let largeTextures = 0;

  for (const { width, height } of chunks.images) {
    totalVRAM += calculateUncompressedMipmapedTextureSize(width, height);

    if (width * height > 2048 * 2048) {
      largeTextures++;
    }
  }

  let texturesScore;

  if (totalVRAM <= 268435500) {
    texturesScore = "Low";
  } else if (totalVRAM <= 536870900) {
    texturesScore = "Medium";
  } else {
    texturesScore = "High";
  }

  const uniqueMaterials = json.materials.length || 0;
  const largeTexturesScore = largeTextures > 0 ? "High" : "Low";

  let materialsScore;

  if (uniqueMaterials <= 25) {
    materialsScore = "Low";
  } else if (uniqueMaterials <= 50) {
    materialsScore = "Medium";
  } else {
    materialsScore = "High";
  }

  const fileSize = glbBlob.size;

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
