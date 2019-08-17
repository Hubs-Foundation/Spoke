import Command from "./Command";
import { TransformSpace } from "../Editor2";

export default class RotateAroundCommand extends Command {
  constructor(editor, object, pivot, axis, angle) {
    super(editor);
    this.object = object;
    this.pivot = pivot.clone();
    this.axis = axis.clone();
    this.angle = angle;
    this.oldRotation = object.rotation.clone();
  }

  execute() {
    this.editor.rotateAround(this.object, this.pivot, this.axis, this.angle, false);
  }

  shouldUpdate(newCommand) {
    return (
      this.object === newCommand.object && this.pivot.equals(newCommand.pivot) && this.axis.equals(newCommand.axis)
    );
  }

  update(command) {
    this.editor.rotateAround(this.object, this.pivot, this.axis, command.angle, false);
  }

  undo() {
    this.editor.setRotation(this.object, this.oldRotation, TransformSpace.Local, false);
  }
}
