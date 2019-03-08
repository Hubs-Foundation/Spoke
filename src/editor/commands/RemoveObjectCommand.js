import Command from "./Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @constructor
 */

export default class RemoveObjectCommand extends Command {
  constructor(object) {
    super();

    this.type = "RemoveObjectCommand";
    this.name = "Remove Object";

    this.object = object;
    this.parent = object !== undefined ? object.parent : undefined;
    if (this.parent !== undefined) {
      this.index = this.parent.children.indexOf(this.object);
    }
  }

  execute() {
    this.editor.removeObject(this.object);
    this.editor.signals.objectRemoved.dispatch(this.object);
    this.editor.signals.sceneGraphChanged.dispatch();
    this.editor.deselect();
  }

  undo() {
    this.editor._addObject(this.object, this.parent, this.index);
    this.editor.signals.objectAdded.dispatch(this.object);
    this.editor.signals.sceneGraphChanged.dispatch();
    this.editor.select(this.object);
  }
}
