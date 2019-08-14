import Command from "./Command";

export default class SetScaleCommand extends Command {
  constructor(editor, object, newScale, optionalOldScale) {
    super(editor);
    this.updatable = true;

    this.object = object;

    if (object !== undefined && newScale !== undefined) {
      this.newScale = newScale.clone();
    }

    if (optionalOldScale !== undefined) {
      this.oldScale = optionalOldScale.clone();
    } else if (object !== undefined) {
      this.oldScale = object.scale.clone();
    }
  }

  execute() {
    this.editor.setScale(this.object, this.newScale, false);
  }

  undo() {
    this.editor.setScale(this.object, this.oldScale, false);
  }

  update(command) {
    this.newScale.copy(command.newScale);
    this.editor.setScale(this.object, this.newScale, false);
  }
}
