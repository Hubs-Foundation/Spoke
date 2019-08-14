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

export default class Editor2 extends EventEmitter {
  constructor() {
    super();

    this.selected = [];
    this.selectedTransformRoots = [];

    this.history = new History();
    this.scene = new SceneNode(this);
    this.nodes = [this.scene];
  }

  addObject(object, parent, before, useHistory = true, emitEvent = true, selectObject = true) {
    if (useHistory) {
      return this.history.execute(new AddObjectCommand(this, object, parent, before));
    }

    object.saveParent = true;

    if (parent !== undefined) {
      if (before !== undefined) {
        const index = parent.children.indexOf(before);
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

    // TODO: Avoid adding duplicates
    for (let i = 0; i < objects.length; i++) {
      this.addObject(objects[i], parent, before, false, false, false);
    }

    if (selectObjects) {
      this.setSelection(objects, false, emitEvent);
    }

    if (emitEvent) {
      this.emit("sceneGraphChanged");
    }
  }

  _addMultipleObjectsWithParentsAndBefores(objects, parents, befores, emitEvent = true, selectObjects = true) {
    // TODO: Avoid adding duplicates
    for (let i = 0; i < objects.length; i++) {
      this.addObject(objects[i], parents[i], befores[i], false, false, false);
    }

    if (selectObjects) {
      this.setSelection(objects, false, emitEvent);
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

    // // TODO: Avoid removing duplicates
    object.traverse(child => {
      if (child.isNode) {
        child.onRemove();
        const index = this.nodes.indexOf(child);
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

    for (let i = 0; i < objects.length; i++) {
      this.removeObject(objects[i], false, false, false);
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

    // TODO: Recalculate transform roots

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

  _updateTransformRoots() {
    this.selectedTransformRoots.length = 0;

    // Recursively find the transformable nodes in the tree with the lowest depth
    const traverse = curObject => {
      if (!curObject.disableTransform && this.selected.indexOf(curObject) !== -1) {
        this.selectedTransformRoots.push(curObject);
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
  }
}
