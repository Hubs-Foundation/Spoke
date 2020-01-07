import * as THREE from "three";
import { acceleratedRaycast, computeBoundsTree } from "three-mesh-bvh";

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;

function exceedsDensityThreshold(count, subtree, params) {
  const bounds = subtree.boundingData;
  const triangleThreshold = params.triangleThreshold;
  const minimumVolume = params.minimumVolume;
  const minimumTriangles = params.minimumTriangles;
  const dx = bounds[3] - bounds[0];
  const dy = bounds[4] - bounds[1];
  const dz = bounds[5] - bounds[2];
  const volume = dx * dy * dz;

  if (volume < minimumVolume) {
    return false;
  }

  if (count < minimumTriangles) {
    return false;
  }

  return count / volume > triangleThreshold;
}

function isHighDensity(subtree, params) {
  if (subtree.count) {
    const result = exceedsDensityThreshold(subtree.count, subtree, params);
    return result === true ? true : subtree.count;
  } else {
    const leftResult = isHighDensity(subtree.left, params);
    if (leftResult === true) return true;
    const rightResult = isHighDensity(subtree.right, params);
    if (rightResult === true) return true;

    const count = leftResult + rightResult;
    const result = exceedsDensityThreshold(count, subtree, params);
    return result === true ? true : count;
  }
}

function isGeometryHighDensity(geo, params) {
  const bvh = geo.boundsTree;
  const roots = bvh._roots;
  for (let i = 0; i < roots.length; ++i) {
    if (isHighDensity(roots[i], params) === true) {
      return true;
    }
  }
  return false;
}

function generateHeightfield(geometry, params) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);

  geometry.computeBoundsTree({ strategy: 1, maxDepth: 40 });

  if (!isGeometryHighDensity(geometry, params)) {
    return null;
  }

  const heightfieldMesh = new THREE.Mesh(geometry);

  const maxSide = Math.max(size.x, size.z);
  const distance = Object.prototype.hasOwnProperty.call(params, "distance")
    ? params.distance
    : Math.max(0.25, Math.pow(maxSide, 1 / 2) / 10);
  const resolution = Math.ceil(maxSide / distance);

  const data = [];

  const offset = new THREE.Vector3();
  geometry.boundingBox.getCenter(offset);

  const down = new THREE.Vector3(0, -1, 0);
  const position = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();

  const offsetX = -maxSide / 2 + offset.x;
  const offsetZ = -maxSide / 2 + offset.z;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let z = 0; z < resolution; z++) {
    data[z] = [];
    for (let x = 0; x < resolution; x++) {
      position.set(offsetX + x * distance, params.raycastY, offsetZ + z * distance);
      raycaster.set(position, down);

      const hits = [];
      heightfieldMesh.raycast(raycaster, hits);
      let hit;

      if (hits.length === 1) {
        hit = hits[0];
      } else {
        for (let i = 0; i < hits.length; i++) {
          if ((!hit || hits[i].distance < hit.distance) && hits[i].point.y < params.minY + params.agentHeight) {
            hit = hits[i];
          }
        }
      }

      if (!hit && hits.length > 0) {
        hit = hits[0];
      }

      let val;

      if (hit) {
        val = hit.point.y;
      } else {
        val = params.minY;
      }

      data[z][x] = val;

      if (val < min) {
        min = data[z][x];
      }
      if (val > max) {
        max = data[z][x];
      }
    }
  }

  if (data.length === 0) {
    return null;
  }

  offset.y = (max + min) / 2; //Bullet expect this to be the center between the max and min heights.

  return { offset, distance, data, width: maxSide, length: maxSide };
}

const defaultParams = {
  raycastY: 1000,
  minY: 0,
  agentHeight: 1.7,
  triangleThreshold: 1000,
  minimumVolume: 0.1,
  minimumTriangles: 100
};

self.onmessage = async event => {
  const message = event.data;

  const params = Object.assign({}, defaultParams, message.params || {});

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute("position", new THREE.Float32BufferAttribute(message.verts, 3));
  const heightfield = generateHeightfield(geometry, params);

  self.postMessage({ heightfield });
};
