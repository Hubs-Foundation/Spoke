import { ExporterExtension } from "./ExporterExtension";

function isKitPieceMaterial(material) {
  return material.isKitPieceMaterial;
}

export class SpokeNodeExporterExtension extends ExporterExtension {
  onRegister() {
    this.exporter.addHook("afterProcessMaterial", isKitPieceMaterial, this.afterProcessMaterial);
  }

  afterProcessMaterial = (material, materialDef) => {
    if (!materialDef.extensions) {
      materialDef.extensions = {};
    }

    materialDef.extensions.MOZ_hubs_components = {
      "kit-alt-materials": {
        materials: material.alternateMaterials.map(altMaterial => this.exporter.processMaterial(altMaterial))
      }
    };

    this.exporter.extensionsUsed["MOZ_hubs_components"] = true;
  };
}
