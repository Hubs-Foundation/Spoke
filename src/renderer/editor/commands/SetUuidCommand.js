import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param newUuid string
 * @constructor
 */

export default class SetUuidCommand extends Command {
  constructor(object, newUuid) {
    super();

    this.type = "SetUuidCommand";
    this.name = "Update UUID";

    this.object = object;

    this.oldUuid = object !== undefined ? object.uuid : undefined;
    this.newUuid = newUuid;
  }

  execute() {
    this.object.uuid = this.newUuid;
    this.editor.signals.objectChanged.dispatch(this.object);
    this.editor.signals.sceneGraphChanged.dispatch();
  }

  undo() {
    this.object.uuid = this.oldUuid;
    this.editor.signals.objectChanged.dispatch(this.object);
    this.editor.signals.sceneGraphChanged.dispatch();
  }

  toJSON() {
    const output = super.toJSON();

    output.oldUuid = this.oldUuid;
    output.newUuid = this.newUuid;

    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);

    this.oldUuid = json.oldUuid;
    this.newUuid = json.newUuid;
    this.object = this.editor.objectByUuid(json.oldUuid);

    if (this.object === undefined) {
      this.object = this.editor.objectByUuid(json.newUuid);
    }
  }
}
