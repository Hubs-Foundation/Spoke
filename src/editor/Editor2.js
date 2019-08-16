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
import ReparentCommand from "./commands/ReparentCommand";
import ReparentMultipleCommand from "./commands/ReparentMultipleCommand";
import DuplicateCommand from "./commands/DuplicateCommand";
import DuplicateMultipleCommand from "./commands/DuplicateMultipleCommand";
import TranslateCommand from "./commands/TranslateCommand";
import TranslateMultipleCommand from "./commands/TranslateMultipleCommand";
import { Matrix4, Vector3 } from "three";
import SetPositionCommand from "./commands/SetPositionCommand";
import SetPositionMultipleCommand from "./commands/SetPositionMultipleCommand";

const tempMatrix1 = new Matrix4();
const tempVector1 = new Vector3();

export const TransformSpace = {
  World: "World",
  Local: "Local",
  LocalSelection: "LocalSelection" // The local space of the last selected object
  // TODO: Viewport, Cursor?
};

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
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new SelectCommand(this, object));
    }

    this.selected.push(object);

    if (object.isNode) {
      object.onSelect();
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    return this.selected;
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
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new SelectMultipleCommand(this, objects));
    }

    for (let i = 0; i < objects.length; i++) {
      this.select(objects[i], false, false, false);
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  selectAll(useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.length === this.nodes.length) {
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new SelectAllCommand(this));
    }

    const objects = this.nodes;

    for (let i = 0; i < objects.length; i++) {
      this.select(objects[i], false, false, false);
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  deselect(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    const index = this.selected.indexOf(object);

    if (index === -1) {
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new DeselectCommand(this, object));
    }

    this.selected.splice(index, 1);

    if (object.isNode) {
      object.onDeselect();
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
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
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new DeselectMultipleCommand(this, objects));
    }

    for (let i = 0; i < objects.length; i++) {
      this.deselect(objects[i], false, false, false);
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  deselectAll(useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.length === 0) {
      return this.selected;
    }

    if (useHistory) {
      return this.history.execute(new DeselectAllCommand(this));
    }

    const objects = this.nodes;

    for (let i = 0; i < objects.length; i++) {
      this.deselect(objects[i], false, false, false);
    }

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
  }

  toggleSelection(object, useHistory = true, emitEvent = true, updateTransformRoots = true) {
    if (this.selected.indexOf(object) !== -1) {
      return this.deselect(object, useHistory, emitEvent, updateTransformRoots);
    } else {
      return this.select(object, useHistory, emitEvent, updateTransformRoots);
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
        return this.selected;
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

    if (emitEvent) {
      this.emit("selectionChanged");
    }

    if (updateTransformRoots) {
      this.updateTransformRoots();
    }

    return this.selected;
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

    object.updateMatrixWorld(true);

    if (selectObject) {
      this.setSelection([object], false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return object;
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

    return rootObjects;
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

    if (object.parent === null) return null; // avoid deleting the camera or scene

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

    return object;
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

    return transformRoots;
  }

  removeSelectedObjects(useHistory = true, emitEvent = true, deselectObjects = true) {
    return this.removeMultipleObjects(this.selected, useHistory, emitEvent, deselectObjects);
  }

  duplicate(object, parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    if (useHistory) {
      return this.history.execute(new DuplicateCommand(this, object, parent, before));
    }

    if (!object.constructor.canAddNode(this)) {
      return;
    }

    const clonedObject = object.clone();

    clonedObject.traverse(o => {
      if (o.isNode) {
        makeUniqueName(this.scene, o);
      }
    });

    this.addObject(clonedObject, parent, before, false, false, false);

    if (selectObject) {
      this.setSelection([clonedObject], false, true, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return clonedObject;
  }

  duplicateMultiple(objects, parent, before, useHistory = true, emitEvent = true, selectObjects = true) {
    if (useHistory) {
      return this.history.execute(new DuplicateMultipleCommand(this, objects, parent, before));
    }

    const validNodes = objects.filter(object => object.constructor.canAddNode(this));
    const duplicatedRoots = getDetachedObjectsRoots(validNodes).map(object => object.clone());

    for (let i = 0; i < duplicatedRoots.length; i++) {
      duplicatedRoots[i].traverse(o => {
        if (o.isNode) {
          makeUniqueName(this.scene, o);
        }
      });
    }

    this.addMultipleObjects(duplicatedRoots, parent, before, false, false, false);

    if (selectObjects) {
      this.setSelection(duplicatedRoots, false, true, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return duplicatedRoots;
  }

  duplicateSelected(parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    this.duplicateMultiple(this.selected, parent, before, useHistory, emitEvent, selectObject);
  }

  reparent(object, newParent, newBefore, useHistory = true, emitEvent = true, selectObject = true) {
    if (!object.parent) {
      throw new Error("Object has no parent. Reparent only works on objects that are currently in the scene.");
    }

    if (!newParent) {
      throw new Error("editor.reparent: newParent is undefined");
    }

    if (useHistory) {
      return this.history.execute(new ReparentCommand(this, object, newParent, newBefore));
    }

    if (newParent !== object.parent) {
      // Maintain world position when reparenting.
      newParent.updateMatrixWorld();

      tempMatrix1.getInverse(newParent.matrixWorld);

      object.parent.updateMatrixWorld();
      tempMatrix1.multiply(object.parent.matrixWorld);

      object.applyMatrix(tempMatrix1);

      object.updateWorldMatrix(false, false);
    }

    const objectIndex = object.parent.children.indexOf(object);
    object.parent.children.splice(objectIndex, 1);

    if (newBefore) {
      const newObjectIndex = newParent.children.indexOf(newBefore);
      newParent.children.splice(newObjectIndex, 0, object);
    } else {
      newParent.children.push(object);
    }

    object.parent = newParent;

    object.updateMatrixWorld(true);

    if (selectObject) {
      this.setSelection([object], false, emitEvent, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return object;
  }

  reparentMultiple(objects, newParent, newBefore, useHistory = true, emitEvent = true, selectObjects = true) {
    if (useHistory) {
      return this.history.execute(new ReparentMultipleCommand(this, objects, newParent, newBefore));
    }

    for (let i = 0; i < objects.length; i++) {
      this.reparent(objects[i], newParent, newBefore, false, false, false);
    }

    if (selectObjects) {
      this.setSelection(objects, false, emitEvent, false);
    }

    this.updateTransformRoots();

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }

    return objects;
  }

  reparentSelected(newParent, newBefore, useHistory = true, emitEvent = true, selectObjects = true) {
    return this.reparentMultiple(this.selected, newParent, newBefore, useHistory, emitEvent, selectObjects);
  }

  translate(object, translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new TranslateCommand(this, object, translation, space));
    }

    if (space === TransformSpace.Local) {
      object.position.add(translation);
    } else {
      object.updateMatrixWorld(); // Update parent world matrices
      tempVector1.setFromMatrixPosition(object.matrixWorld);
      tempVector1.add(translation);

      let spaceMatrix;

      if (space === TransformSpace.World) {
        spaceMatrix = tempMatrix1.getInverse(object.parent.matrixWorld);
      } else if (space === TransformSpace.LocalSelection) {
        if (this.selected.length > 0) {
          const lastSelectedObject = this.selected[this.selected.length - 1];
          lastSelectedObject.updateMatrixWorld();
          spaceMatrix = tempMatrix1.getInverse(lastSelectedObject.parent.matrixWorld);
        } else {
          spaceMatrix = tempMatrix1.identity();
        }
      } else {
        spaceMatrix = space;
      }

      tempVector1.applyMatrix4(spaceMatrix);
      object.position.copy(tempVector1);
    }

    object.updateMatrixWorld(true);

    object.onChange("position");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "position");
    }

    return object;
  }

  translateMultiple(objects, translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new TranslateMultipleCommand(this, objects, translation, space));
    }

    if (space === TransformSpace.LocalSelection) {
      if (this.selected.length > 0) {
        const lastSelectedObject = this.selected[this.selected.length - 1];
        lastSelectedObject.updateMatrixWorld();
        space = tempMatrix1.getInverse(lastSelectedObject.parent.matrixWorld);
      } else {
        space = tempMatrix1.identity();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      this.translate(objects[i], translation, space, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "position");
    }

    return objects;
  }

  translateSelected(translation, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.translateMultiple(this.selectedTransformRoots, translation, space, useHistory, emitEvent);
  }

  // rotate(object, angle, axis, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // rotateMultiple(objects, angle, axis, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // rotateSelected(angle, axis, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // scale(object, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // scaleMultiple(objects, scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  // scaleSelected(scale, space = TransformSpace.World, useHistory = true, emitEvent = true) {}

  setPosition(object, position, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPositionCommand(this, object, position, space));
    }

    if (space === TransformSpace.Local) {
      object.position.copy(position);
    } else {
      object.updateMatrixWorld(); // Update parent world matrices

      tempVector1.copy(position);

      let spaceMatrix;

      if (space === TransformSpace.World) {
        spaceMatrix = tempMatrix1.getInverse(object.parent.matrixWorld);
      } else if (space === TransformSpace.LocalSelection) {
        if (this.selected.length > 0) {
          const lastSelectedObject = this.selected[this.selected.length - 1];
          lastSelectedObject.updateMatrixWorld();
          spaceMatrix = tempMatrix1.getInverse(lastSelectedObject.parent.matrixWorld);
        } else {
          spaceMatrix = tempMatrix1.identity();
        }
      } else {
        spaceMatrix = space;
      }

      tempVector1.applyMatrix4(spaceMatrix);
      object.position.copy(tempVector1);
    }

    object.updateMatrixWorld(true);

    object.onChange("position");

    if (emitEvent) {
      this.emit("objectsChanged", [object], "position");
    }

    return object;
  }

  setPositionMultiple(objects, position, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    if (useHistory) {
      return this.history.execute(new SetPositionMultipleCommand(this, objects, position, space));
    }

    if (space === TransformSpace.LocalSelection) {
      if (this.selected.length > 0) {
        const lastSelectedObject = this.selected[this.selected.length - 1];
        lastSelectedObject.updateMatrixWorld();
        space = tempMatrix1.getInverse(lastSelectedObject.parent.matrixWorld);
      } else {
        space = tempMatrix1.identity();
      }
    }

    for (let i = 0; i < objects.length; i++) {
      this.setPosition(objects[i], position, space, false);
    }

    if (emitEvent) {
      this.emit("objectsChanged", objects, "position");
    }

    return objects;
  }

  setPositionSelected(position, space = TransformSpace.World, useHistory = true, emitEvent = true) {
    return this.setPositionMultiple(this.selectedTransformRoots, position, space, useHistory, emitEvent);
  }

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

  updateTransformRoots() {
    this.selectedTransformRoots.length = 0;
    this.getTransformRoots(this.selected, this.selectedTransformRoots);
  }
}
