import { getDefaultsFromSchema } from "./utils";

export default class BaseComponent {
  constructor() {
    this.name = this.constructor.componentName;
    this.schema = this.constructor.schema;
    this.props = {};
    this.shouldSave = false;
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

  static getComponent(node) {
    return node.userData._gltfComponents.find(component => component.name === this.componentName);
  }

  static _propsFromObject() {
    return {};
  }

  static _getOrCreateComponent(node, props) {
    if (!props) {
      props = { ...getDefaultsFromSchema(this.schema), ...this._propsFromObject(node) };
    }
    if (!node.userData._gltfComponents) {
      node.userData._gltfComponents = [];
    }

    let component = this.getComponent(node);
    if (!component) {
      component = new this();
      node.userData._gltfComponents.push(component);
    }

    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        component.props[key] = props[key];
      }
    }

    return { component, props };
  }

  static inflate(node, props) {
    return this._getOrCreateComponent(node, props).component;
  }

  static deflate(node) {
    const components = node.userData._gltfComponents;
    const componentIndex = components.findIndex(component => component.name === this.componentName);
    const component = components[componentIndex];
    if (component._object) {
      component._object.parent.remove(component._object);
    }
    components.splice(componentIndex, 1);
  }
}
