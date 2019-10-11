import Command from "./Command";
import { TransformSpace } from "../Editor";
import arrayShallowEqual from "../utils/arrayShallowEqual";
import { serializeVector3, serializeObject3DArray } from "../utils/debug";

export default class SetPositionMultipleCommand extends Command {
  constructor(editor, objects, position, space) {
    super(editor);
    this.objects = objects.slice(0);
    this.position = position.clone();
    this.space = space;
    this.oldPositions = objects.map(o => o.position.clone());
  }

  execute() {
    this.editor.setPositionMultiple(this.objects, this.position, this.space, false);
  }

  shouldUpdate(newCommand) {
    return this.space === newCommand.space && arrayShallowEqual(this.objects, newCommand.objects);
  }

  update(command) {
    this.position = command.position.clone();
    this.editor.setPositionMultiple(this.objects, command.position, this.space, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      this.editor.setPosition(this.objects[i], this.oldPositions[i], TransformSpace.Local, false, false);
    }

    this.editor.emit("objectsChanged", this.objects, "position");
  }

  toString() {
    return `SetPositionMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} position: ${serializeVector3(this.position)} space: ${this.space}`;
  }
}
