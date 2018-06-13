import Editor from "./Editor";

export const types = {
  color: Symbol("color"),
  number: Symbol("number")
};

export function getDisplayName(name) {
  return name
    .split("-")
    .map(([f, ...rest]) => f.toUpperCase() + rest.join(""))
    .join(" ");
}

function getDefaultsFromSchema(schema) {
  const defaults = {};
  schema.forEach(prop => {
    defaults[prop.name] = prop.default;
  });
  return defaults;
}

const lightSchema = [
  { name: "color", type: types.color, default: "white" },
  { name: "intensity", type: types.number, default: 1 }
];

Editor.registerGLTFComponent({
  name: "ambient-light",
  schema: lightSchema,
  inflate: function(node, props) {
    if (!props) {
      props = getDefaultsFromSchema(this.schema);
    }
    const light = new THREE.AmbientLight(props.color, props.intensity);
    light.userData._dontShowInHierarchy = true;
    node.add(light);
  }
});

Editor.registerGLTFComponent({
  name: "directional-light",
  schema: lightSchema,
  inflate: function(node, props) {
    if (!props) {
      props = getDefaultsFromSchema(this.schema);
    }
    if (!node.userData.MOZ_components) {
      node.userData.MOZ_components = [];
    }
    node.userData.MOZ_components.push({ name: this.name, props });
    const light = new THREE.DirectionalLight(props.color, props.intensity);
    light.userData._dontShowInHierarchy = true;
    node.add(light);
  }
});
