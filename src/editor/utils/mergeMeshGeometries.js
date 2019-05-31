import { BufferGeometry, Float32BufferAttribute } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";

function createEmptyGeometry() {
  const emptyGeometry = new BufferGeometry();
  emptyGeometry.setIndex([]);
  emptyGeometry.addAttribute("position", new Float32BufferAttribute([], 3));
  return emptyGeometry;
}

export default function mergeMeshGeometries(meshes) {
  const geometries = [];

  for (const mesh of meshes) {
    let geometry = mesh.geometry;
    let attributes = geometry.attributes;

    if (!geometry.isBufferGeometry) {
      geometry = new BufferGeometry().fromGeometry(geometry);
      attributes = geometry.attributes;
    }

    if (!attributes.position) {
      continue;
    }

    if (attributes.position.itemSize !== 3) {
      throw new Error("Tried to merge geometry with an invalid number of positions");
    }

    if (geometry.index) geometry = geometry.toNonIndexed();

    const cloneGeometry = new BufferGeometry();
    cloneGeometry.addAttribute("position", geometry.attributes.position.clone());
    mesh.updateMatrixWorld();
    cloneGeometry.applyMatrix(mesh.matrixWorld);
    geometry = cloneGeometry;

    geometries.push(geometry);
  }

  if (geometries.length === 0) {
    return createEmptyGeometry();
  }

  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

  const flippedGeometry = geometry.clone();

  const positions = flippedGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 9) {
    const x0 = positions[i];
    const y0 = positions[i + 1];
    const z0 = positions[i + 2];
    const offset = 6;
    positions[i] = positions[i + offset];
    positions[i + 1] = positions[i + offset + 1];
    positions[i + 2] = positions[i + offset + 2];
    positions[i + offset] = x0;
    positions[i + offset + 1] = y0;
    positions[i + offset + 2] = z0;
  }

  return BufferGeometryUtils.mergeBufferGeometries([geometry, flippedGeometry]);
}
