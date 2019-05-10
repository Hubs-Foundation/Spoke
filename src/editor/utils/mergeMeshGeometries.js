import THREE from "../../vendor/three";

export default function mergeMeshGeometries(meshes) {
  const geometries = [];

  for (const mesh of meshes) {
    let geometry = mesh.geometry;
    let attributes = geometry.attributes;

    if (!geometry.isBufferGeometry) {
      geometry = new THREE.BufferGeometry().fromGeometry(geometry);
      attributes = geometry.attributes;
    }

    if (!attributes.position || attributes.position.itemSize !== 3) return;

    if (geometry.index) geometry = geometry.toNonIndexed();

    const cloneGeometry = new THREE.BufferGeometry();
    cloneGeometry.addAttribute("position", geometry.attributes.position.clone());
    mesh.updateMatrixWorld();
    cloneGeometry.applyMatrix(mesh.matrixWorld);
    geometry = cloneGeometry;

    geometries.push(geometry);
  }

  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  const geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);

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

  return THREE.BufferGeometryUtils.mergeBufferGeometries([geometry, flippedGeometry]);
}
