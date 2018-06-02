import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param newMaterial THREE.Material
 * @constructor
 */

export default class SetMaterialCommand extends Command {
  constructor(object, newMaterial, materialSlot) {
    super();

    this.type = "SetMaterialCommand";
    this.name = "New Material";

    this.object = object;
    this.materialSlot = materialSlot;

    this.oldMaterial = this.editor.getObjectMaterial(object, materialSlot);
    this.newMaterial = newMaterial;
  }

  execute() {
    this.editor.setObjectMaterial(this.object, this.materialSlot, this.newMaterial);
    this.editor.signals.materialChanged.dispatch(this.newMaterial);
  }

  undo() {
    this.editor.setObjectMaterial(this.object, this.materialSlot, this.oldMaterial);
    this.editor.signals.materialChanged.dispatch(this.oldMaterial);
  }

  toJSON() {
    const output = super.toJSON();

    output.objectUuid = this.object.uuid;
    output.oldMaterial = this.oldMaterial.toJSON();
    output.newMaterial = this.newMaterial.toJSON();

    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);

    this.object = this.editor.objectByUuid(json.objectUuid);

    function parseMaterial(json) {
      const loader = new THREE.ObjectLoader();
      const images = loader.parseImages(json.images);
      const textures = loader.parseTextures(json.textures, images);
      const materials = loader.parseMaterials([json], textures);
      return materials[json.uuid];
    }

    this.oldMaterial = parseMaterial(json.oldMaterial);
    this.newMaterial = parseMaterial(json.newMaterial);
  }
}
