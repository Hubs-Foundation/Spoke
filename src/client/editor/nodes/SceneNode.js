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

      const parent = scene.getObjectByName(entity.parent);
      const node = await EntityNodeConstructor.deserialize(editor, entity);

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
      entityJson.index = child.parent.children.indexOf(child);
      sceneJson.entities[this.name] = entityJson;
    });

    return sceneJson;
  }
}
