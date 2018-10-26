export const mixin = Object3DClass =>
  class extends Object3DClass {
    static shouldDeserialize(/* entityJson */) {
      // TODO: in a future scene format just check for the node type.
      return false;
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
      this.isNode = true;
    }

    copy(source, recursive) {
      super.copy(source, recursive);
    }

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
  };
