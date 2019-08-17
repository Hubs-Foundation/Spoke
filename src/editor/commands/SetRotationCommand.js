import Command from "./Command";
import { TransformSpace } from "../Editor2";

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
    this.editor.setRotation(this.object, command.rotation, this.space, false);
  }

  undo() {
    this.editor.setRotation(this.object, this.oldRotation, TransformSpace.Local, false);
  }
}
