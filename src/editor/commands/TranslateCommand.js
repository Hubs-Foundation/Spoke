import Command from "./Command";
import { TransformSpace } from "../Editor";
import { serializeObject3D, serializeVector3 } from "../utils/debug";

export default class TranslateCommand extends Command {
  constructor(editor, object, translation, space) {
    super(editor);
    this.object = object;
    this.translation = translation.clone();
    this.space = space;
    this.oldPosition = object.position.clone();
  }

  execute() {
    this.editor.translate(this.object, this.translation, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.object === newCommand.object && this.space === newCommand.space;
  }

  update(command) {
    this.translation.add(command.translation);
    this.editor.translate(this.object, command.translation, this.space, false);
  }

  undo() {
    this.editor.setPosition(this.object, this.oldPosition, TransformSpace.Local, false);
  }

  toString() {
    return `TranslateCommand id: ${this.id} object: ${serializeObject3D(this.object)} translation: ${serializeVector3(
      this.translation
    )} space: ${this.space}`;
  }
}
