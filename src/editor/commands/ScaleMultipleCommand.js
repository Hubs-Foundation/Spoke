import Command from "./Command";
import { TransformSpace } from "../Editor";
import arrayShallowEqual from "../utils/arrayShallowEqual";
import { serializeVector3, serializeObject3DArray } from "../utils/debug";

export default class ScaleMultipleCommand extends Command {
  constructor(editor, objects, scale, space) {
    super(editor);
    this.objects = objects.slice(0);
    this.scale = scale.clone();
    this.space = space;
    this.oldScales = objects.map(o => o.scale.clone());
  }

  execute() {
    this.editor.scaleMultiple(this.objects, this.scale, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.space === newCommand.space && arrayShallowEqual(this.objects, newCommand.objects);
  }

  update(command) {
    this.scale.multiply(command.scale);
    this.editor.scaleMultiple(this.objects, command.scale, this.space, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setScale(this.objects[i], this.oldScales[i], TransformSpace.Local, false, false);
    }

    this.editor.emit("objectsChanged", this.objects, "scale");
  }

  toString() {
    return `ScaleMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} scale: ${serializeVector3(this.scale)} space: ${this.space}`;
  }
}
