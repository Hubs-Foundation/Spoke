import Command from "./Command";
import { TransformSpace } from "../Editor";
import arrayShallowEqual from "../utils/arrayShallowEqual";
import { serializeObject3DArray, serializeEuler } from "../utils/debug";

export default class SetRotationMultipleCommand extends Command {
  constructor(editor, objects, rotation, space) {
    super(editor);
    this.objects = objects.slice(0);
    this.rotation = rotation.clone();
    this.space = space;
    this.oldRotations = objects.map(o => o.rotation.clone());
  }

  execute() {
    this.editor.setRotationMultiple(this.objects, this.rotation, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.space === newCommand.space && arrayShallowEqual(this.objects, newCommand.objects);
  }

  update(command) {
    this.rotation = command.rotation.clone();
    this.editor.setRotationMultiple(this.objects, command.rotation, this.space, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setRotation(this.objects[i], this.oldRotations[i], TransformSpace.Local, false, false);
    }

    this.editor.emit("objectsChanged", this.objects, "rotation");
  }

  toString() {
    return `SetRotationMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} rotation: ${serializeEuler(this.rotation)} space: ${this.space}`;
  }
}
