import THREE from "../vendor/three";

const { DEG2RAD } = THREE.Math;

export const types = {
  color: Symbol("color"),
  number: Symbol("number"),
  boolean: Symbol("boolean")
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

export function registerGLTFComponents(editor) {
  editor.registerGLTFComponent({
    name: "directional-light",
    schema: [
      ...lightSchema,
      { name: "castShadow", type: types.boolean, default: true },
      { name: "elevation", type: types.number, default: 63 },
      { name: "azimuth", type: types.number, default: 245 }
    ],
    _tempEuler: new THREE.Euler(0, 0, 0, "YXZ"),
    updateProperty: function(node, propertyName, value) {
      const component = node.userData.MOZ_components.find(component => component.name === this.name);
      component.props[propertyName] = value;
      switch (propertyName) {
        case "color":
          component._object.color.set(value);
          break;
        case "elevation":
        case "azimuth":
          this._tempEuler.set(component.props.elevation * DEG2RAD, -component.props.azimuth * DEG2RAD, 0);
          component._object.position.set(0, 0, -100);
          component._object.position.applyEuler(this._tempEuler);
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

      let component = node.userData.MOZ_components.find(component => component.name === this.name);
      if (!component) {
        component = { name: this.name, props: {} };
        node.userData.MOZ_components.push(component);
      }

      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          component.props[key] = props[key];
        }
      }

      const light = new THREE.DirectionalLight(props.color, props.intensity);
      Object.defineProperty(component, "_object", { enumerable: false, value: light });
      this.updateProperty(node, "azimuth", props.azimuth);
      this.updateProperty(node, "elevation", props.elevation);
      this.updateProperty(node, "castShadow", props.castShadow);
      light.userData._dontShowInHierarchy = true;
      node.add(light);
    }
  });
  editor.registerGLTFComponent({
    name: "shadow",
    schema: [
      { name: "castShadow", type: types.boolean, default: true },
      { name: "receiveShadow", type: types.boolean, default: true }
    ],
    updateProperty: function(node, propertyName, value) {
      // TODO Silly to have to find the component instance every time.
      const component = node.userData.MOZ_components.find(component => component.name === this.name);
      component.props[propertyName] = value;
      switch (propertyName) {
        default:
          component._object.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
              obj[propertyName] = value;
              obj.material.needsUpdate = true;
            }
          });
      }
    },
    inflate: function(node, props) {
      // TODO Lots of repitition from direction-light component. Refactor this into super class
      if (!props) {
        props = getDefaultsFromSchema(this.schema);
      }
      if (!node.userData.MOZ_components) {
        node.userData.MOZ_components = [];
      }

      let component = node.userData.MOZ_components.find(component => component.name === this.name);
      if (!component) {
        component = { name: this.name, props: {} };
        node.userData.MOZ_components.push(component);
      }

      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          component.props[key] = props[key];
        }
      }

      Object.defineProperty(component, "_object", { enumerable: false, value: node });
      this.updateProperty(node, "castShadow", props.castShadow);
      this.updateProperty(node, "receiveShadow", props.receiveShadow);
    }
  });
}
