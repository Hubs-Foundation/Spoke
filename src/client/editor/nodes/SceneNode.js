import THREE from "../three";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes } from "../StaticMode";
import sortEntities from "../utils/sortEntities";

export default class SceneNode extends EditorNodeMixin(THREE.Scene) {
  static nodeName = "Scene";

  static hideTransform = true;

  static async deserialize(editor, json) {
    const scene = new SceneNode();

    const { root, metadata, entities } = json;

    scene.name = root;
    scene.metadata = metadata;

    const sortedEntities = sortEntities(entities);

    for (const entityName of sortedEntities) {
      const entity = entities[entityName];

      let EntityNodeConstructor;

      for (const NodeConstructor of editor.nodeTypes) {
        if (NodeConstructor.shouldDeserialize(entity)) {
          EntityNodeConstructor = NodeConstructor;
          break;
        }
      }

      if (!EntityNodeConstructor) {
        throw new Error(`No node constructor found for entity "${entityName}"`);
      }

      const parent = this.getNodeWithName(entity.parent);

      if (!parent) {
        throw new Error(`Node "${entityName}" specifies parent "${entity.parent}", but was not found.`);
      }

      const node = await EntityNodeConstructor.deserialize(editor, entity);
      node.name = entityName;
      node.onChange();

      parent.children.splice(entity.index, 0, node);
      node.parent = parent;
    }

    return scene;
  }

  constructor() {
    super();
    this.url = null;
    this.metadata = {};
    setStaticMode(this, StaticModes.Static);
  }

  getNodeWithName(name) {
    let node = null;

    // TODO: Don't traverse the whole tree. Return early if found.
    this.traverse(child => {
      if (!node && child.isNode && child.name === name) {
        node = child;
      }
    });

    return node;
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    this.url = source.url;
    this.metadata = source.metadata;

    return this;
  }

  serialize() {
    const sceneJson = {
      root: this.name,
      metadata: this.metadata,
      entities: {}
    };

    this.traverse(child => {
      if (!child.isNode || child === this) {
        return;
      }

      const entityJson = child.serialize();
      entityJson.parent = child.parent.name;

      let index = 0;

      for (const sibling of child.parent.children) {
        if (sibling === child) {
          break;
        } else if (sibling.isNode) {
          index++;
        }
      }

      entityJson.index = index;
      sceneJson.entities[child.name] = entityJson;
    });

    return sceneJson;
  }
}
