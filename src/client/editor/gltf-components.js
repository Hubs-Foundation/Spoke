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
    this.props = {};
  }
  static getComponent(node) {
    return node.userData.MOZ_components.find(component => component.name === this.componentName);
  }
  getProperty(propertyName) {
    return this.props[propertyName];
  }
  _updateComponentProperty(propertyName, value) {
    this.props[propertyName] = value;
  }
  updateProperty(propertyName, value) {
    this._updateComponentProperty(propertyName, value);
  }
  static _getOrCreateComponent(node, props) {
    if (!props) {
      props = getDefaultsFromSchema(this.schema);
    }
    if (!node.userData.MOZ_components) {
      node.userData.MOZ_components = [];
    }

    let component = this.getComponent(node);
    if (!component) {
      component = new this();
      node.userData.MOZ_components.push(component);
    }

    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        component.props[key] = props[key];
      }
    }

    return { component, props };
  }
  static inflate(node, props) {
    this._getOrCreateComponent(node, props);
  }
  static deflate(node) {
    const components = node.userData.MOZ_components;
    const componentIndex = components.findIndex(component => component.name === this.name);
    const component = components[componentIndex];
    if (component._object) {
      component._object.parent.remove(component._object);
    }
    components.splice(componentIndex, 1);
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
  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    const { _tempEuler } = DirectionalLightComponent;
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      case "elevation":
      case "azimuth":
        _tempEuler.set(this.props.elevation * DEG2RAD, -this.props.azimuth * DEG2RAD, 0);
        this._object.position.set(0, 0, -100);
        this._object.position.applyEuler(_tempEuler);
        break;
      default:
        this._object[propertyName] = value;
    }
  }
  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.DirectionalLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    component._updateComponentProperty("azimuth", props.azimuth);
    component._updateComponentProperty("elevation", props.elevation);
    component._updateComponentProperty("castShadow", props.castShadow);
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
  }
}

class PointLightComponent extends BaseComponent {
  static componentName = "point-light";
  static schema = [...lightSchema, { name: "castShadow", type: types.boolean, default: true }];
  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      default:
        this._object[propertyName] = value;
    }
  }
  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.PointLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
    component._updateComponentProperty("castShadow", props.castShadow);
    light.userData._dontShowInHierarchy = true;
    light.userData._inflated = true;
    node.add(light);
  }
}

class AmbientLightComponent extends BaseComponent {
  static componentName = "ambient-light";
  static schema = [...lightSchema];
  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    switch (propertyName) {
      case "color":
        this._object.color.set(value);
        break;
      default:
        this._object[propertyName] = value;
    }
  }
  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    const light = new THREE.AmbientLight(props.color, props.intensity);
    Object.defineProperty(component, "_object", { enumerable: false, value: light });
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
  _updateComponentProperty(propertyName, value) {
    super._updateComponentProperty(propertyName, value);
    this._object.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj[propertyName] = value;
        obj.material.needsUpdate = true;
      }
    });
  }
  static inflate(node, _props) {
    const { component, props } = this._getOrCreateComponent(node, _props);
    Object.defineProperty(component, "_object", { enumerable: false, value: node });
    component._updateComponentProperty("castShadow", props.castShadow);
    component._updateComponentProperty("receiveShadow", props.receiveShadow);
  }
}

export function registerGLTFComponents(editor) {
  [DirectionalLightComponent, PointLightComponent, AmbientLightComponent, ShadowComponent].forEach(
    editor.registerGLTFComponent.bind(editor)
  );
}
