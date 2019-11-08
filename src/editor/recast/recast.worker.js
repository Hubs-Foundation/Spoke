import Recast from "recast-wasm/dist/recast.js";

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

let recast = null;

self.onmessage = async event => {
  const message = event.data;

  try {
    if (!recast) {
      recast = Recast({
        locateFile(path) {
          if (path.endsWith(".wasm")) {
            return message.params.wasmUrl;
          }
        }
      });
    }

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

    if (status === 13) {
      // No contours could be generated. This happens when there are zero walkable cells.
      self.postMessage({ indices: [], verts: [], heightfield: null });
      recast.freeNavMesh();
      return;
    }

    if (status !== 0) {
      self.postMessage({ error: "unknown error building nav mesh", status });
      recast.freeNavMesh();
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
    self.postMessage(
      {
        indices,
        verts
      },
      [indices.buffer, verts.buffer]
    );

    recast.freeNavMesh();
  } catch (err) {
    console.error(err);
    self.postMessage({ error: err.message || "unknown error building nav mesh" });
  }
};
