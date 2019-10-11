import Command from "./Command";
import { TransformSpace } from "../Editor";
import arrayShallowEqual from "../utils/arrayShallowEqual";
import { serializeVector3, serializeObject3DArray } from "../utils/debug";

export default class TranslateMultipleCommand extends Command {
  constructor(editor, objects, translation, space) {
    super(editor);
    this.objects = objects.slice(0);
    this.translation = translation.clone();
    this.space = space;
    this.oldPositions = objects.map(o => o.position.clone());
  }

  execute() {
    this.editor.translateMultiple(this.objects, this.translation, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.space === newCommand.space && arrayShallowEqual(this.objects, newCommand.objects);
  }

  update(command) {
    this.translation.add(command.translation);
    this.editor.translateMultiple(this.objects, command.translation, this.space, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setPosition(this.objects[i], this.oldPositions[i], TransformSpace.Local, false, false);
    }

    this.editor.emit("objectsChanged", this.objects, "position");
  }

  toString() {
    return `TranslateMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} translation: ${serializeVector3(this.translation)} space: ${this.space}`;
  }
}
