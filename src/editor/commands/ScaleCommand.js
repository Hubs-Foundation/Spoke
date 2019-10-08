import Command from "./Command";
import { TransformSpace } from "../Editor";
import { serializeObject3D, serializeVector3 } from "../utils/debug";

export default class ScaleCommand extends Command {
  constructor(editor, object, scale, space) {
    super(editor);
    this.object = object;
    this.scale = scale.clone();
    this.space = space;
    this.oldScale = object.scale.clone();
  }

  execute() {
    this.editor.scale(this.object, this.scale, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.object === newCommand.object && this.space === newCommand.space;
  }

  update(command) {
    this.scale.multiply(command.scale);
    this.editor.scale(this.object, command.scale, this.space, false);
  }

  undo() {
    this.editor.setScale(this.object, this.oldScale, TransformSpace.Local, false);
  }

  toString() {
    return `ScaleCommand id: ${this.id} object: ${serializeObject3D(this.object)} scale: ${serializeVector3(
      this.scale
    )} space: ${this.space}`;
  }
}
