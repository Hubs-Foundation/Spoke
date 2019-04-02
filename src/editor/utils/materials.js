export function forEachMaterial(object3D, fn) {
  if (!object3D.material) return;

  if (Array.isArray(object3D.material)) {
    object3D.material.forEach(fn);
  } else {
    fn(object3D.material);
  }
}

export function traverseMaterials(object3D, fn) {
  object3D.traverse(obj => forEachMaterial(obj, fn));
}
