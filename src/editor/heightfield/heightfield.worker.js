import * as THREE from "three";
import { MeshBVH, acceleratedRaycast, computeBoundsTree } from "three-mesh-bvh";

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;

function generateHeightfield(geometry, params) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);

  geometry.computeBoundsTree();

  const heightfieldMesh = new THREE.Mesh(geometry);

  const maxSide = Math.max(size.x, size.z);
  const distance = params.hasOwnProperty("distance") ? params.distance : Math.max(0.25, Math.pow(maxSide, 1 / 2) / 10);
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
  agentHeight: 1.7
};

self.onmessage = async event => {
  const message = event.data;

  const params = Object.assign({}, defaultParams, message.params || {});

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute("position", new THREE.Float32BufferAttribute(message.verts, 3));
  const heightfield = generateHeightfield(geometry, params);

  self.postMessage({ heightfield });
};
