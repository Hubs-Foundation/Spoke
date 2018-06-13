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
  name: "directional-light",
  schema: lightSchema,
  updateProperty: function(node, propertyName, value) {
    const component = node.userData.MOZ_components.find(component => component.name == this.name);
    component.props[propertyName] = value;
    switch (propertyName) {
      case "color":
        component._object.color.set(value);
        break;
      default:
        component._object[propertyName] = value;
    }
  },
  inflate: function(node, props) {
    if (!props) {
      props = getDefaultsFromSchema(this.schema);
    }
    if (!node.userData.MOZ_components) {
      node.userData.MOZ_components = [];
    }
    // TODO Dunno if it's a good idea to store _object on the component, but I need it for updateProperties
    const light = new THREE.DirectionalLight(props.color, props.intensity);
    light.userData._dontShowInHierarchy = true;
    node.userData.MOZ_components.push({ _object: light, name: this.name, props });
    node.add(light);
  }
});
