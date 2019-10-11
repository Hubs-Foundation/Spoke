import Command from "./Command";
import { TransformSpace } from "../Editor";
import arrayShallowEqual from "../utils/arrayShallowEqual";
import { serializeObject3DArray, serializeVector3 } from "../utils/debug";

export default class RotateAroundMultipleCommand extends Command {
  constructor(editor, objects, pivot, axis, angle) {
    super(editor);
    this.objects = objects.slice(0);
    this.pivot = pivot.clone();
    this.axis = axis.clone();
    this.angle = angle;
    this.oldRotations = objects.map(o => o.rotation.clone());
    this.oldPositions = objects.map(o => o.position.clone());
  }

  execute() {
    this.editor.rotateAroundMultiple(this.objects, this.pivot, this.axis, this.angle, false);
  }

  shouldUpdate(newCommand) {
    return (
      this.pivot.equals(newCommand.pivot) &&
      this.axis.equals(newCommand.axis) &&
      arrayShallowEqual(this.objects, newCommand.objects)
    );
  }

  update(command) {
    this.angle += command.angle;
    this.editor.rotateAroundMultiple(this.objects, this.pivot, this.axis, command.angle, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setRotation(this.objects[i], this.oldRotations[i], TransformSpace.Local, false, false);
    }

    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setPosition(this.objects[i], this.oldPositions[i], TransformSpace.Local, false, false);
    }

    this.editor.emit("objectsChanged", this.objects, "matrix");
  }

  toString() {
    return `RotateAroundMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} pivot: ${serializeVector3(this.pivot)} axis: { ${serializeVector3(this.axis)} angle: ${this.angle} space: ${
      this.space
    }`;
  }
}
