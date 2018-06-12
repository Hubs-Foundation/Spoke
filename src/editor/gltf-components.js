import Editor from "./Editor";

const types = {
  color: Symbol(),
  number: Symbol()
};

const lightSchema = {
  color: { type: types.color, default: new THREE.Color(1, 1, 1) },
  intensity: { type: types.number, default: 1 }
};

Editor.registerGLTFComponent("directional-light", {
  schema: lightSchema,
  inflate: function(node, props) {
    node.add(new THREE.DirectionalLight(props.color, props.intensity));
  }
});
