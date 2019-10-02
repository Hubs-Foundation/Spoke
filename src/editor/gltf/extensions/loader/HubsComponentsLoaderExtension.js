import { LoaderExtension } from "./LoaderExtension";
import KitPieceMaterial from "../../../materials/KitPieceMaterial";
import UnlitKitPieceMaterial from "../../../materials/UnlitKitPieceMaterial";
import KitSubPiece from "../../../objects/KitSubPiece";
import { getUnlitMaterial } from "./MaterialsUnlitLoaderExtension";

function getKitAltMaterialsComponent(materialDef) {
  return (
    materialDef.extensions &&
    materialDef.extensions.MOZ_hubs_components &&
    materialDef.extensions.MOZ_hubs_components["kit-alt-materials"]
  );
}

function isKitSubPiece(meshDef, primitiveDef, geometry, material) {
  return material.isKitPieceMaterial;
}

export class HubsComponentsLoaderExtension extends LoaderExtension {
  static extensionName = "MOZ_hubs_components";

  extensionNames = [HubsComponentsLoaderExtension.extensionName];

  onLoad() {
    if (this.loader.usesExtension(HubsComponentsLoaderExtension.extensionName)) {
      this.loader.addHook("createMaterial", getKitAltMaterialsComponent, this.createMaterial);
      this.loader.addHook("createPrimitive", isKitSubPiece, this.createPrimitive);
    }
  }

  createMaterial = async (materialDef, materialParams) => {
    const { materials } = getKitAltMaterialsComponent(materialDef);

    const pending = [];

    for (const materialIndex of materials) {
      pending.push(this.loader.getDependency("material", materialIndex));
    }

    const altMaterials = await Promise.all(pending);

    if (getUnlitMaterial(materialDef)) {
      return new UnlitKitPieceMaterial(materialParams, altMaterials);
    } else {
      return new KitPieceMaterial(materialParams, altMaterials);
    }
  };

  createPrimitive = async (meshDef, primitiveDef, geometry, material) => new KitSubPiece(geometry, material);
}
