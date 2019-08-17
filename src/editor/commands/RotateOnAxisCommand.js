import Command from "./Command";
import { TransformSpace } from "../Editor2";

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
    this.editor.rotateOnAxis(this.object, this.axis, command.angle, this.space, false);
  }

  undo() {
    this.editor.setRotation(this.object, this.oldRotation, TransformSpace.Local, false);
  }
}
