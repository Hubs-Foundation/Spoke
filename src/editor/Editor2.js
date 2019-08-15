import EventEmitter from "eventemitter3";
import SelectCommand from "./commands/SelectCommand";
import SelectMultipleCommand from "./commands/SelectMultipleCommand";
import SelectAllCommand from "./commands/SelectAllCommand";
import DeselectCommand from "./commands/DeselectCommand";
import DeselectMultipleCommand from "./commands/DeselectMultipleCommand";
import DeselectAllCommand from "./commands/DeselectAllCommand";
import AddObjectCommand from "./commands/AddObjectCommand";
import AddMultipleObjectsCommand from "./commands/AddMultipleObjectsCommand";
import SceneNode from "./nodes/SceneNode";
import SetSelectionCommand from "./commands/SetSelectionCommand";
import History from "./History";
import RemoveObjectCommand from "./commands/RemoveObjectCommand";
import RemoveMultipleObjectsCommand from "./commands/RemoveMultipleObjectsCommand";
import makeUniqueName from "./utils/makeUniqueName";
import Renderer from "./renderer/Renderer";
import LoadingCube from "./objects/LoadingCube";
import { loadEnvironmentMap } from "./utils/EnvironmentMap";
import TextureCache from "./caches/TextureCache";
import GLTFCache from "./caches/GLTFCache";
import getDetachedObjectsRoots from "./utils/getDetachedObjectsRoots";

// const TransformSpace = {
//   World: "World",
//   Local: "Local"
//   // TODO: Viewport, Cursor?
// };

let resolveRenderer;
let rejectRenderer;
const rendererPromise = new Promise((resolve, reject) => {
  resolveRenderer = resolve;
  rejectRenderer = reject;
});

export default class Editor2 extends EventEmitter {
  constructor(api) {
    super();
    this.api = api;
    this.projectId = null;

    this.selected = [];
    this.selectedTransformRoots = [];

    this.history = new History();

    this.renderer = null;

    this.nodeTypes = new Set();
    this.nodeEditors = new Map();

    this.textureCache = new TextureCache();
    this.gltfCache = new GLTFCache(this.textureCache);

    this.scene = new SceneNode(this);
    this.sceneModified = false;
    this.sceneLoaded = false;
    this.nodes = [this.scene];
  }

  async init() {
    const tasks = [rendererPromise, loadEnvironmentMap(), LoadingCube.load()];

    for (const NodeConstructor of this.nodeTypes) {
      tasks.push(NodeConstructor.load());
    }

    await Promise.all(tasks);
  }

  initializeRenderer(canvas) {
    try {
      this.renderer = new Renderer(this, canvas);
      resolveRenderer();
    } catch (error) {
      rejectRenderer(error);
    }
  }

  update() {
    this.renderer.update();
  }

  select(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.indexOf(object) !== -1) {
      return;
    }

    if (useHistory) {
      return this.history.execute(new SelectCommand(this, object));
    }

    this.selected.push(object);

    if (object.isNode) {
      object.onSelect();
    }

    if (updateTransformRoots) {
      this._updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }
  }

  selectMultiple(objects, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    let selectionChanged = false;

    for (let i = 0; i < objects.length; i++) {
      if (this.selected.indexOf(objects[i]) === -1) {
        selectionChanged = true;
        break;
      }
    }

    if (!selectionChanged) {
      return;
    }

    if (useHistory) {
      return this.history.execute(new SelectMultipleCommand(this, objects));
    }

    for (let i = 0; i < objects.length; i++) {
      this.select(objects[i], false, false, false);
    }

    if (updateTransformRoots) {
      this._updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }
  }

  selectAll(useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.length === this.nodes.length) {
      return;
    }

    if (useHistory) {
      return this.history.execute(new SelectAllCommand(this));
    }

    const objects = this.nodes;

    for (let i = 0; i < objects.length; i++) {
      this.select(objects[i], false, false, false);
    }

    if (updateTransformRoots) {
      this._updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }
  }

  deselect(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    const index = this.selected.indexOf(object);

    if (index === -1) {
      return;
    }

    if (useHistory) {
      return this.history.execute(new DeselectCommand(this, object));
    }

    this.selected.splice(index, 1);

    if (object.isNode) {
      object.onDeselect();
    }

    if (updateTransformRoots) {
      this._updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }
  }

  deselectMultiple(objects, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    let selectionChanged = false;

    for (let i = 0; i < objects.length; i++) {
      if (this.selected.indexOf(objects[i]) !== -1) {
        selectionChanged = true;
        break;
      }
    }

    if (!selectionChanged) {
      return;
    }

    if (useHistory) {
      return this.history.execute(new DeselectMultipleCommand(this, objects));
    }

    for (let i = 0; i < objects.length; i++) {
      this.deselect(objects[i], false, false, false);
    }

    if (updateTransformRoots) {
      this._updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }
  }

  deselectAll(useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.length === 0) {
      return;
    }

    if (useHistory) {
      return this.history.execute(new DeselectAllCommand(this));
    }

    const objects = this.nodes;

    for (let i = 0; i < objects.length; i++) {
      this.deselect(objects[i], false, false, false);
    }

    if (updateTransformRoots) {
      this._updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }
  }

  toggleSelection(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.indexOf(object) !== -1) {
      this.deselect(object, useHistory, emitEvent, updateTransformRoots);
    } else {
      this.select(object, useHistory, emitEvent, updateTransformRoots);
    }
  }

  setSelection(objects, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (objects.length === this.selected.length) {
      let equalSelection = true;

      for (let i = 0; i < objects.length; i++) {
        // TODO: Should selection order matter?
        if (this.selected[i] !== objects[i]) {
          equalSelection = false;
          break;
        }
      }

      if (equalSelection) {
        return;
      }
    }

    if (useHistory) {
      return this.history.execute(new SetSelectionCommand(this, objects));
    }

    const prevSelected = this.selected.slice(0);

    for (let i = this.selected.length - 1; i >= 0; i--) {
      const object = this.selected.pop();

      if (object.isNode && objects.indexOf(object) === -1) {
        object.onDeselect();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];

      this.selected.push(object);

      if (object.isNode && prevSelected.indexOf(object) === -1) {
        object.onSelect();
      }
    }

    if (updateTransformRoots) {
      this._updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }
  }

  getTransformRoots(objects, target = []) {
    // Recursively find the transformable nodes in the tree with the lowest depth
    const traverse = curObject => {
      if (!curObject.disableTransform && objects.indexOf(curObject) !== -1) {
        target.push(curObject);
        return;
      }

      const children = curObject.children;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.isNode) {
          traverse(child);
        }
      }
    };

    traverse(this.scene);

    return target;
  }

  _updateTransformRoots() {
    this.selectedTransformRoots.length = 0;
    this.getTransformRoots(this.selected, this.selectedTransformRoots);
  }

  addObject(object, parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    // TODO: Add makeUniqueName option
    if (useHistory) {
      return this.history.execute(new AddObjectCommand(this, object, parent, before));
    }

    object.saveParent = true;

    if (parent !== undefined) {
      if (before !== undefined) {
        const index = parent.children.indexOf(before);

        if (index === -1) {
          throw new Error("addObject: before object not found");
        }

        parent.children.splice(index, 0, object);
        object.parent = parent;
      } else {
        parent.add(object);
      }
    } else {
      this.scene.add(object);
    }

    object.traverse(child => {
      if (child.isNode) {
        child.onAdd();
        this.nodes.push(child);
      }
    });

    if (selectObject) {
      this.setSelection([object], false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }
  }

  addMultipleObjects(objects, parent, before, useHistory = true, emitEvent = true, selectObjects = true) {
    if (useHistory) {
      return this.history.execute(new AddMultipleObjectsCommand(this, objects, parent, before));
    }

    const rootObjects = getDetachedObjectsRoots(objects);

    for (let i = 0; i < rootObjects.length; i++) {
      this.addObject(rootObjects[i], parent, before, false, false, false);
    }

    if (selectObjects) {
      this.setSelection(objects, false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }
  }

  _addMultipleObjectsWithParentsAndBefores(objects, parents, befores, oldNodes, emitEvent = true) {
    // Only use the roots of the objects array so that we don't add objects multiple times
    const rootObjects = getDetachedObjectsRoots(objects);

    // Add objects in reverse order so that befores are added first
    for (let i = rootObjects.length - 1; i >= 0; i--) {
      const rootObject = rootObjects[i];
      const rootIndex = objects.indexOf(rootObject);
      this.addObject(rootObject, parents[rootIndex], befores[rootIndex], false, false, false);
    }

    // Nodes are now out of order. Restore the old nodes list.
    this.nodes.length = 0;

    for (let i = 0; i < oldNodes.length; i++) {
      this.nodes.push(oldNodes[i]);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }
  }

  removeObject(object, useHistory = true, emitEvent = true, deselectObject = true) {
    if (useHistory) {
      return this.history.execute(new RemoveObjectCommand(this, object));
    }

    if (object.parent === null) return; // avoid deleting the camera or scene

    object.traverse(child => {
      if (child.isNode) {
        child.onRemove();
        const index = this.nodes.indexOf(child);

        if (index === -1) {
          throw new Error(
            "removeObject: node not found. This is due to removing a node that is no longer in the scene."
          );
        }

        this.nodes.splice(index, 1);
      }
    });

    object.parent.remove(object);

    if (deselectObject) {
      this.deselect(object, false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }
  }

  removeMultipleObjects(objects, useHistory = true, emitEvent = true, deselectObjects = true) {
    if (useHistory) {
      return this.history.execute(new RemoveMultipleObjectsCommand(this, objects));
    }

    const transformRoots = this.getTransformRoots(objects);

    for (let i = 0; i < transformRoots.length; i++) {
      this.removeObject(transformRoots[i], false, false, false);
    }

    if (deselectObjects) {
      this.deselectMultiple(objects, false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }
  }

  removeSelectedObjects(useHistory = true, emitEvent = true, deselectObjects = true) {
    this.removeMultipleObjects(this.selected, useHistory, emitEvent, deselectObjects);
  }

  duplicate(object, parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    if (!object.constructor.canAddNode(this)) {
      return;
    }

    const clonedObject = object.clone();

    clonedObject.traverse(o => {
      if (o.isNode) {
        makeUniqueName(this.scene, o);
      }
    });

    this.addObject(clonedObject, parent, before, useHistory, emitEvent, selectObject);
  }

  duplicateMultiple(objects, parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    const validNodes = objects.filter(object => object.constructor.canAddNode(this));
    const duplicatedRoots = getDetachedObjectsRoots(validNodes).map(object => object.clone());

    for (let i = 0; i < duplicatedRoots.length; i++) {
      duplicatedRoots[i].traverse(o => {
        if (o.isNode) {
          makeUniqueName(this.scene, o);
        }
      });
    }

    this.addMultipleObjects(duplicatedRoots, parent, before, useHistory, emitEvent, selectObject);
  }

  duplicateSelected(parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    this.duplicateMultiple(this.selected, parent, before, useHistory, emitEvent, selectObject);
  }

  // reparent(object, parent, before, useHistory = true, emitEvent = true, updateTransformRoots = true) {}

  // reparentMultiple(objects, parent, before, useHistory = true, emitEvent = true, updateTransformRoots = true) {}

  // reparentSelected(parent, before, useHistory = true, emitEvent = true, updateTransformRoots = true) {}

  // translate(object, translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // translateMultiple(objects, translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // translateSelected(translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // rotate(object, angle, axis, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // rotateMultiple(objects, angle, axis, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // rotateSelected(angle, axis, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // scale(object, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // scaleMultiple(objects, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // scaleSelected(scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setPosition(object, position, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setPositionMultiple(objects, position, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setPositionSelected(position, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setRotation(object, rotation, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setRotationMultiple(objects, rotation, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setRotationSelected(rotation, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setScale(object, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setScaleMultiple(objects, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setScaleSelected(scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // setNodeProperty(object, propertyName, value, oldValue, useHistory = true, emitEvent = true) {}

  // setObjectPropertyMultiple(objects, propertyName, value, oldValue, useHistory = true, emitEvent = true) {}

  // setObjectPropertySelected(propertyName, value, oldValue, useHistory = true, emitEvent = true) {}

  // setObjectProperties(object, properties, oldValue, useHistory = true, emitEvent = true) {}

  // setObjectPropertiesMultiple(objects, properties, oldValues, useHistory = true, emitEvent = true) {}

  // setObjectPropertiesSelected(properties, oldValues, useHistory = true, emitEvent = true) {}
}
