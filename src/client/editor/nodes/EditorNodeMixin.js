import {
  StaticModes,
  computeStaticMode,
  computeAndSetStaticModes,
  isDynamic,
  isInherits,
  isStatic
} from "../StaticMode";

export default function EditorNodeMixin(Object3DClass) {
  return class extends Object3DClass {
    static nodeName = "Unknown Node";

    static hideTransform = false;

    static async load() {
      return Promise.resolve();
    }

    static shouldDeserialize(entityJson) {
      return !!entityJson.components.find(c => c.name === this.legacyComponentName);
    }

    static async deserialize(editor, json) {
      const node = new this();

      const transformComponent = json.components.find(c => c.name === "transform");

      if (!transformComponent) {
        throw new Error("Node has no transform component");
      }

      const { position, rotation, scale } = transformComponent.props;

      node.position.set(position.x, position.y, position.z);
      node.rotation.set(rotation.x, rotation.y, rotation.z);
      node.scale.set(scale.x, scale.y, scale.z);

      return node;
    }

    constructor(...args) {
      super(...args);

      this.nodeName = this.constructor.nodeName;
      this.name = this.constructor.nodeName;
      this.isNode = true;
      this.isCollapsed = false;

      this.staticMode = StaticModes.Inherits;
      this.originalStaticMode = null;
      this.saveParent = false;
    }

    onChange() {}

    onSelect() {}

    onDeselect() {}

    serialize() {
      return {
        components: [
          {
            name: "transform",
            props: {
              position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
              },
              rotation: {
                x: this.rotation.x,
                y: this.rotation.y,
                z: this.rotation.z
              },
              scale: {
                x: this.scale.x,
                y: this.scale.y,
                z: this.scale.z
              }
            }
          }
        ]
      };
    }

    prepareForExport() {}

    computeStaticMode() {
      return computeStaticMode(this);
    }

    computeAndSetStaticModes() {
      return computeAndSetStaticModes(this);
    }

    isInherits() {
      return isInherits(this);
    }

    isStatic() {
      return isStatic(this);
    }

    isDynamic() {
      return isDynamic(this);
    }

    findNodeByType(nodeType) {
      if (this.constructor === nodeType) {
        return this;
      }

      for (const child of this.children) {
        if (child.isNode) {
          const result = child.findNodeByType(nodeType);

          if (result) {
            return result;
          }
        }
      }

      return null;
    }

    getNodesByType(nodeType) {
      const nodes = [];

      if (this.constructor === nodeType) {
        return nodes.push(this);
      }

      for (const child of this.children) {
        if (child.isNode) {
          const results = child.getNodesByType(nodeType);

          for (const result of results) {
            nodes.push(result);
          }
        }
      }

      return nodes;
    }
  };
}
