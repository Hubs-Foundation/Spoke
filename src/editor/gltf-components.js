import Editor from "./Editor";

const types = {
  color: Symbol(),
  number: Symbol()
};

const lightSchema = {
  color: { type: types.color, default: new THREE.Color(1, 1, 1) },
  intensity: { type: types.number, default: 1 }
};

function getDefaultsFromSchema(schema) {
  const defaults = {};
  for (const key in schema) {
    if (!schema.hasOwnProperty(key)) continue;
    defaults[key] = schema[key].default;
  }
  return defaults;
}

Editor.registerGLTFComponent("ambient-light", {
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

Editor.registerGLTFComponent("directional-light", {
  schema: lightSchema,
  inflate: function(node, props) {
    if (!props) {
      props = getDefaultsFromSchema(this.schema);
    }
    const light = new THREE.DirectionalLight(props.color, props.intensity);
    light.userData._dontShowInHierarchy = true;
    node.add(light);
  }
});
