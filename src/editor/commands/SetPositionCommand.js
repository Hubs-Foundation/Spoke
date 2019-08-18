import Command from "./Command";
import { TransformSpace } from "../Editor";

export default class SetPositionCommand extends Command {
  constructor(editor, object, position, space) {
    super(editor);
    this.object = object;
    this.position = position.clone();
    this.space = space;
    this.oldPosition = object.position.clone();
  }

  execute() {
    this.editor.setPosition(this.object, this.position, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.object === newCommand.object && this.space === newCommand.space;
  }

  update(command) {
    this.editor.setPosition(this.object, command.position, this.space, false);
  }

  undo() {
    this.editor.setPosition(this.object, this.oldPosition, TransformSpace.Local, false);
  }
}
