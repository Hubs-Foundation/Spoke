import { Mesh } from "three";

export default class KitSubPiece extends Mesh {
  isKitSubPiece = true;

  constructor(geometry, material) {
    super(geometry, material);
    this.originalMaterial = material;

    if (material.isKitPieceMaterial) {
      this.materialChoices = [material, ...material.alternateMaterials];
    } else {
      this.materialChoices = [material];
    }
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.originalMaterial = source.originalMaterial;
    this.materialChoices = source.materialChoices.slice(0);

    return this;
  }
}
