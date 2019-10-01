import { MeshStandardMaterial } from "three";

export default class KitPieceMaterial extends MeshStandardMaterial {
  isKitPieceMaterial = true;

  constructor(params, alternateMaterials = []) {
    super(params);
    this.alternateMaterials = alternateMaterials;
  }
}
