import Command from "./Command";
import { serializeObject3DArray } from "../utils/debug";

export default class LoadMaterialSlotMultipleCommand extends Command {
  constructor(editor, objects, subPieceId, materialSlotId, materialId) {
    super(editor);
    this.objects = objects.slice(0);
    this.subPieceId = subPieceId;
    this.materialSlotId = materialSlotId;
    this.materialId = materialId;
    this.prevMaterialIds = objects.map(object => object.getMaterialIdForMaterialSlot(subPieceId, materialSlotId));
  }

  execute() {
    this.editor.loadMaterialSlotMultiple(this.objects, this.subPieceId, this.materialSlotId, this.materialId, false);
  }

  undo() {
    for (let i = 0; i < this.objects.length; i++) {
      const object = this.objects[i];
      this.editor.loadMaterialSlot(object, this.subPieceId, this.materialSlotId, this.prevMaterialIds[i], false, false);
    }

    this.editor.emit("objectsChanged", this.objects, "materialSlot");
  }

  toString() {
    return `LoadMaterialSlotMultipleCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.objects
    )} subPieceId: ${this.subPieceId} materialSlotId: ${this.materialSlotId} materialId: ${this.materialId}`;
  }
}
