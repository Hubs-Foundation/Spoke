import Command from "../Command";

export default class SetNameCommand extends Command {
  constructor(object, newName) {
    super();

    this.type = "SetNameCommand";

    this.object = object;
    this.oldName = object !== undefined ? object.name : undefined;
    this.newName = newName;
  }

  execute() {
    this.editor.setObjectName(this.object, this.newName);
    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    this.editor.setObjectName(this.object, this.oldName);
    this.editor.signals.objectChanged.dispatch(this.object);
  }
}
