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

class BaseComponent {
  constructor() {
    this.name = this.constructor.componentName;
    this.schema = this.constructor.schema;
  }
  _getComponent(node) {
    return node.userData.MOZ_components.find(component => component.name === this.name);
  }
  getProperty(node, propertyName) {
    return this._getComponent(node).props[propertyName];
  }
  _updateComponentProperty(component, propertyName, value) {
    component.props[propertyName] = value;
  }
  updateProperty(node, propertyName, value) {
    this._updateComponentProperty(this._getComponent(node), propertyName, value);
  }
  _getOrCreateComponent(node, props) {
    if (!props) {
      props = getDefaultsFromSchema(this.constructor.schema);
    }
    if (!node.userData.MOZ_components) {
      node.userData.MOZ_components = [];
    }

    let component = this._getComponent(node);
    if (!component) {
      component = { name: this.name, props: {} };
      node.userData.MOZ_components.push(component);
    }

    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        component.props[key] = props[key];
      }
    }

    return { component, props };
  }
  inflate(node, props) {
    this._getOrCreateComponent(node, props);
  }
}

const lightSchema = [
  { name: "color", type: types.color, default: "white" },
  { name: "intensity", type: types.number, default: 1 }
];

class DirectionalLightComponent extends BaseComponent {
  static componentName = "directional-light";
  static schema = [
    ...lightSchema,
    { name: "castShadow", type: types.boolean, default: true },
    { name: "elevation", type: types.number, default: 63 },
    { name: "azimuth", type: types.number, default: 245 }
  ];
  static _tempEuler = new THREE.Euler(0, 0, 0, "YXZ");
  _updateComponentProperty(component, propertyName, value) {
    super._updateComponentProperty(component, propertyName, value);
    const { _tempEuler } = DirectionalLightComponent;
    switch (propertyName) {
      case "color":
        component._object.color.set(value);
        break;
      case "elevation":
      case "azimuth":
        _tempEuler.set(component.props.elevation * DEG2RAD, -component.props.azimuth * DEG2RAD, 0);
        component._object.position.set(0, 0, -100);
        component._object.position.applyEuler(_tempEuler);
        break;
      default:
        component._object[propertyName] = value;
    }
  }
  inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.DirectionalLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    this._updateComponentProperty(component, "azimuth", props.azimuth);
    this._updateComponentProperty(component, "elevation", props.elevation);
    this._updateComponentProperty(component, "castShadow", props.castShadow);
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
  }
}

class PointLightComponent extends BaseComponent {
  static componentName = "point-light";
  static schema = [...lightSchema, { name: "castShadow", type: types.boolean, default: true }];
  _updateComponentProperty(component, propertyName, value) {
    super._updateComponentProperty(component, propertyName, value);
    switch (propertyName) {
      case "color":
        component._object.color.set(value);
        break;
      default:
        component._object[propertyName] = value;
    }
  }
  inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.PointLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    this._updateComponentProperty(component, "castShadow", props.castShadow);
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
  }
}

class ShadowComponent extends BaseComponent {
  static componentName = "shadow";
  static schema = [
    { name: "castShadow", type: types.boolean, default: true },
    { name: "receiveShadow", type: types.boolean, default: true }
  ];
  _updateComponentProperty(component, propertyName, value) {
    super._updateComponentProperty(component, propertyName, value);
    component._object.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj[propertyName] = value;
        obj.material.needsUpdate = true;
      }
    });
  }
  inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    Object.defineProperty(component, "_object", { enumerable: false, value: node });
    this._updateComponentProperty(component, "castShadow", props.castShadow);
    this._updateComponentProperty(component, "receiveShadow", props.receiveShadow);
  }
}

export function registerGLTFComponents(editor) {
  [DirectionalLightComponent, PointLightComponent, ShadowComponent].forEach(editor.registerGLTFComponent.bind(editor));
}
