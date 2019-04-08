import Command from "./Command";
import THREE from "../../vendor/three";

export default class SetMaterialPropertyCommand extends Command {
  constructor(object, material, propertyName, value) {
    super();

    this.type = "SetMaterialPropertyCommand";

    this.object = object;
    this.material = material;
    this.propertyName = propertyName;

    if (value && value.clone) {
      this.newValue = value.clone();
    } else {
      this.newValue = value;
    }

    const oldValue = this.material[propertyName];

    if (oldValue && oldValue.clone) {
      this.oldValue = oldValue.clone();
    } else {
      this.oldValue = oldValue;
    }
  }

  execute() {
    const value = this.material[this.propertyName];

    if (value && value.copy) {
      this.material[this.propertyName].copy(this.newValue);
    } else {
      this.material[this.propertyName] = this.newValue;
    }

    if (this.newValue instanceof THREE.Texture) {
      this.material.needsUpdate = true;
    }

    this.editor.signals.objectChanged.dispatch(this.object);
  }

  undo() {
    const value = this.material[this.propertyName];

    if (value && value.copy) {
      this.material[this.propertyName].copy(this.oldValue);
    } else {
      this.material[this.propertyName] = this.oldValue;
    }

    if (this.oldValue instanceof THREE.Texture) {
      this.material.needsUpdate = true;
    }

    this.editor.signals.objectChanged.dispatch(this.object);
  }
}
