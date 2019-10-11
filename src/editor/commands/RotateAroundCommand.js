import Command from "./Command";
import { TransformSpace } from "../Editor";
import { serializeObject3D, serializeVector3 } from "../utils/debug";

export default class RotateAroundCommand extends Command {
  constructor(editor, object, pivot, axis, angle) {
    super(editor);
    this.object = object;
    this.pivot = pivot.clone();
    this.axis = axis.clone();
    this.angle = angle;
    this.oldPosition = object.position.clone();
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
    this.angle += command.angle;
    this.editor.rotateAround(this.object, this.pivot, this.axis, command.angle, false);
  }

  undo() {
    // TODO: Add editor.setMatrix command
    this.editor.setPosition(this.object, this.oldPosition, TransformSpace.Local, false, false);
    this.editor.setRotation(this.object, this.oldRotation, TransformSpace.Local, false, false);
    this.editor.emit("objectsChanged", this.objects, "matrix");
  }

  toString() {
    return `RotateAroundCommand id: ${this.id} object: ${serializeObject3D(this.object)} pivot: ${serializeVector3(
      this.pivot
    )} axis: ${serializeVector3(this.axis)} angle: ${this.angle}`;
  }
}
