import THREE from "../three";

export const types = {
  color: "color",
  number: "number",
  vector: "vector",
  euler: "euler",
  boolean: "boolean",
  file: "file",
  string: "string"
};

const geometry = new THREE.SphereBufferGeometry(1, 4, 2);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

export function addPicker(parent, selectionRoot) {
  const picker = new THREE.Mesh(geometry, material);
  picker.name = "picker";

  Object.defineProperty(picker.userData, "_selectionRoot", {
    value: selectionRoot,
    configurable: true,
    enumerable: false
  });
  picker.userData._inflated = true;
  picker.userData._dontExport = true;

  parent.add(picker);
}
