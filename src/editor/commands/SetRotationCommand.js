import Command from "./Command";

export default class SetRotationCommand extends Command {
  constructor(editor, object, newRotation, optionalOldRotation) {
    super(editor);
    this.updatable = true;

    this.object = object;

    if (object !== undefined && newRotation !== undefined) {
      this.newRotation = newRotation.clone();
    }

    if (optionalOldRotation !== undefined) {
      this.oldRotation = optionalOldRotation.clone();
    } else if (object !== undefined) {
      this.oldRotation = object.rotation.clone();
    }
  }

  execute() {
    this.editor.setRotation(this.object, this.newRotation, false);
  }

  update(command) {
    this.newRotation.copy(command.newRotation);
    this.editor.setRotation(this.object, this.newRotation, false);
  }

  undo() {
    this.editor.setRotation(this.object, this.oldRotation, false);
  }
}
