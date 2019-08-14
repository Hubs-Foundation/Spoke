import Command from "./Command";

export default class SetPositionCommand extends Command {
  constructor(editor, object, newPosition, optionalOldPosition) {
    super(editor);
    this.updatable = true;

    this.object = object;

    if (object !== undefined && newPosition !== undefined) {
      this.newPosition = newPosition.clone();
    }

    if (optionalOldPosition !== undefined) {
      this.oldPosition = optionalOldPosition.clone();
    } else if (object !== undefined) {
      this.oldPosition = object.position.clone();
    }
  }

  execute() {
    this.editor.setPosition(this.object, this.newPosition, false);
  }

  update(command) {
    this.newPosition.copy(command.newPosition);
    this.editor.setPosition(this.object, this.newPosition, false);
  }

  undo() {
    this.editor.setPosition(this.object, this.oldPosition, false);
  }
}
