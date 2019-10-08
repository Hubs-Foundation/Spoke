import Command from "./Command";
import { TransformSpace } from "../Editor";
import { serializeObject3D, serializeEuler } from "../utils/debug";

export default class SetRotationCommand extends Command {
  constructor(editor, object, rotation, space) {
    super(editor);
    this.object = object;
    this.rotation = rotation.clone();
    this.space = space;
    this.oldRotation = object.rotation.clone();
  }

  execute() {
    this.editor.setRotation(this.object, this.rotation, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.object === newCommand.object && this.space === newCommand.space;
  }

  update(command) {
    this.rotation = command.rotation.clone();
    this.editor.setRotation(this.object, command.rotation, this.space, false);
  }

  undo() {
    this.editor.setRotation(this.object, this.oldRotation, TransformSpace.Local, false);
  }

  toString() {
    return `SetRotationCommand id: ${this.id} object: ${serializeObject3D(this.object)} rotation: ${serializeEuler(
      this.rotation
    )} space: ${this.space}`;
  }
}
