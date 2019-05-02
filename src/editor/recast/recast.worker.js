import Recast from "recast-wasm/dist/recast.js";
import recastWasmUrl from "recast-wasm/dist/recast.wasm";
import * as THREE from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";

THREE.Mesh.prototype.raycast = acceleratedRaycast;

function generateHeightfield(geometry) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);

  const bvh = new MeshBVH(geometry);

  const heightfieldMesh = new THREE.Mesh(geometry);

  const maxSide = Math.max(size.x, size.z);
  const distance = Math.max(0.25, Math.pow(maxSide, 1 / 2) / 10);
  const resolution = Math.ceil(maxSide / distance);

  const data = [];

  const down = new THREE.Vector3(0, -1, 0);
  const position = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();

  const offsetX = -size.x / 2;
  const offsetZ = -size.z / 2;

  let min = Infinity;
  for (let z = 0; z < resolution; z++) {
    data[z] = [];
    for (let x = 0; x < resolution; x++) {
      position.set(offsetX + x * distance, size.y / 2, offsetZ + z * distance);
      raycaster.set(position, down);

      const hit = bvh.raycastFirst(heightfieldMesh, raycaster, raycaster.ray);

      let val;

      if (hit) {
        val = -hit.distance + size.y / 2;
      } else {
        val = -size.y / 2;
      }

      data[z][x] = val;

      if (val < min) {
        min = data[z][x];
      }
    }
  }

  const offset = new THREE.Vector3(-size.x / 2, min, -size.z / 2);

  // Cannon.js will be consuming this data and it doesn't like heightfields with negative heights.
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      data[z][x] -= min;
    }
  }

  if (data.length === 0) {
    return null;
  }

  return { offset, distance, data };
}

const defaultParams = {
  cellSize: 0.166,
  cellHeight: 0.1,
  agentHeight: 1.7,
  agentRadius: 0.5,
  agentMaxClimb: 0.3,
  agentMaxSlope: 45,
  regionMinSize: 1,
  regionMergeSize: 20,
  edgeMaxLen: 12,
  edgeMaxError: 1,
  vertsPerPoly: 3,
  detailSampleDist: 16,
  detailSampleMaxError: 1
};

const recast = Recast({
  locateFile(path) {
    if (path.endsWith(".wasm")) {
      return new URL(recastWasmUrl, process.env.BASE_ASSETS_PATH || "https://hubs.local:9090").href;
    }
  }
});

self.onmessage = async event => {
  const message = event.data;

  try {
    await recast.ready;

    if (!recast.loadArray(message.verts, message.faces)) {
      self.postMessage({ error: "error loading navmesh data" });
    }

    const {
      cellSize,
      cellHeight,
      agentHeight,
      agentRadius,
      agentMaxClimb,
      agentMaxSlope,
      regionMinSize,
      regionMergeSize,
      edgeMaxLen,
      edgeMaxError,
      vertsPerPoly,
      detailSampleDist,
      detailSampleMaxError
    } = Object.assign({}, defaultParams, message.params || {});

    const status = recast.build(
      cellSize,
      cellHeight,
      agentHeight,
      agentRadius,
      agentMaxClimb,
      agentMaxSlope,
      regionMinSize,
      regionMergeSize,
      edgeMaxLen,
      edgeMaxError,
      vertsPerPoly,
      detailSampleDist,
      detailSampleMaxError
    );

    if (status !== 0) {
      self.postMessage({ error: "unknown error building nav mesh", status });
      return;
    }

    const meshes = recast.getMeshes();
    const wasmVerts = recast.getVerts();
    const verts = new Float32Array(wasmVerts.length);
    verts.set(wasmVerts);
    const tris = recast.getTris();

    const indices = new Uint16Array((tris.length / 4) * 3);
    let index = 0;

    const numMeshes = meshes.length / 4;

    for (let i = 0; i < numMeshes; i++) {
      const meshOffset = i * 4;
      const meshVertsOffset = meshes[meshOffset];
      const meshTrisOffset = meshes[meshOffset + 2];
      const meshNumTris = meshes[meshOffset + 3];

      for (let j = 0; j < meshNumTris; j++) {
        const triangleOffset = (meshTrisOffset + j) * 4;

        const a = meshVertsOffset + tris[triangleOffset];
        const b = meshVertsOffset + tris[triangleOffset + 1];
        const c = meshVertsOffset + tris[triangleOffset + 2];

        indices[index++] = a;
        indices[index++] = b;
        indices[index++] = c;
      }
    }

    let heightfield = null;

    if (message.generateHeightfield) {
      const geometry = new THREE.BufferGeometry();
      geometry.addAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      geometry.setIndex(new THREE.Uint16BufferAttribute(indices, 1));
      heightfield = generateHeightfield(geometry);
    }

    self.postMessage(
      {
        indices,
        verts,
        heightfield
      },
      [indices.buffer, verts.buffer]
    );

    recast.freeNavMesh();
  } catch (err) {
    console.error(err);
    self.postMessage({ error: err.message || "unknown error building nav mesh" });
  }
};
