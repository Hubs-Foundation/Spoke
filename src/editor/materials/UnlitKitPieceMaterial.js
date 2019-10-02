import { MeshBasicMaterial } from "three";

export default class UnlitKitPieceMaterial extends MeshBasicMaterial {
  isKitPieceMaterial = true;

  constructor(params, alternateMaterials = []) {
    super(params);
    this.alternateMaterials = alternateMaterials;
  }
}
