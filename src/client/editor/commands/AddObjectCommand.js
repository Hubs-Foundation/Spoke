import THREE from "../../vendor/three";
import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @constructor
 */

export default class AddObjectCommand extends Command {
  constructor(object, parent) {
    super();
    this.type = "AddObjectCommand";

    this.object = object;
    this.parent = parent;

    if (object !== undefined) {
      this.name = "Add Object: " + object.name;
    }
  }

  execute() {
    this.editor.addObject(this.object, this.parent);
    this.editor.select(this.object);
  }

  undo() {
    this.editor.removeObject(this.object);
    this.editor.deselect();
  }
}
