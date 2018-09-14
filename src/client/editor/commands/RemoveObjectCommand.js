import Command from "../Command";

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
    const scope = this.editor;
    this.object.traverse(function(child) {
      scope.removeHelper(child);
    });

    this.parent.remove(this.object);
    this.editor.select(this.parent);

    this.editor.signals.objectRemoved.dispatch(this.object);
    this.editor.signals.sceneGraphChanged.dispatch();
  }

  undo() {
    const scope = this.editor;

    this.object.traverse(child => {
      scope.addHelper(child, this.object);
    });

    this.parent.children.splice(this.index, 0, this.object);
    this.object.parent = this.parent;
    this.editor.select(this.object);

    this.editor.signals.objectAdded.dispatch(this.object);
    this.editor.signals.sceneGraphChanged.dispatch();
  }
}
