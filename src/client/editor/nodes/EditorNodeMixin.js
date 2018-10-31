import { StaticModes } from "../StaticMode";

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

      const { position, rotation, scale } = transformComponent;

      node.position.copy(position);
      node.rotation.copy(rotation);
      node.scale.copy(scale);

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
      let cur = this;

      while (cur) {
        if (cur.staticMode === StaticModes.Inherits || cur.staticMode === undefined) {
          cur = cur.parent;
        } else {
          return cur.staticMode;
        }
      }

      return StaticModes.Dynamic;
    }

    computeAndSetStaticModes() {
      this.traverse(curNode => {
        const staticMode = curNode.computeStaticMode();
        curNode.setStaticMode(staticMode);
      });
    }

    isInherits() {
      const staticMode = this.staticMode;
      return staticMode === StaticModes.Inherits || staticMode === undefined;
    }

    isStatic() {
      return this.staticMode === StaticModes.Static;
    }

    isDynamic() {
      return this.staticMode === StaticModes.Dynamic;
    }
  };
}
