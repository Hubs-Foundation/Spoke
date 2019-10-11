import Command from "./Command";
import { TransformSpace } from "../Editor";
import { serializeObject3D, serializeVector3 } from "../utils/debug";

export default class RotateOnAxisCommand extends Command {
  constructor(editor, object, axis, angle, space) {
    super(editor);
    this.object = object;
    this.axis = axis.clone();
    this.angle = angle;
    this.space = space;
    this.oldRotation = object.rotation.clone();
  }

  execute() {
    this.editor.rotateOnAxis(this.object, this.axis, this.angle, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.object === newCommand.object && this.space === newCommand.space && this.axis.equals(newCommand.axis);
  }

  update(command) {
    this.angle += command.angle;
    this.editor.rotateOnAxis(this.object, this.axis, command.angle, this.space, false);
  }

  undo() {
    this.editor.setRotation(this.object, this.oldRotation, TransformSpace.Local, false);
  }

  toString() {
    return `RotateOnAxisCommand id: ${this.id} object: ${serializeObject3D(this.object)} axis: ${serializeVector3(
      this.axis
    )} angle: ${this.angle} space: ${this.space}`;
  }
}
