import { Color, DoubleSide, MeshBasicMaterial, sRGBEncoding, RGBFormat, RGBAFormat } from "three";
import { ALPHA_MODES } from "../../GLTFLoader";
import { LoaderExtension } from "./LoaderExtension";

export function getUnlitMaterial(materialDef) {
  return materialDef.extensions && materialDef.extensions[MaterialsUnlitLoaderExtension.extensionName];
}

export class MaterialsUnlitLoaderExtension extends LoaderExtension {
  static extensionName = "KHR_materials_unlit";

  extensionNames = [MaterialsUnlitLoaderExtension.extensionName];

  onLoad() {
    if (this.loader.usesExtension(MaterialsUnlitLoaderExtension.extensionName)) {
      this.loader.addHook("gatherMaterialParams", getUnlitMaterial, this.gatherMaterialParams);
      this.loader.addHook("createMaterial", getUnlitMaterial, this.createMaterial);
    }
  }

  gatherMaterialParams = async materialDef => {
    const materialParams = {};

    const pending = [];

    materialParams.color = new Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;

    const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

    const metallicRoughness = materialDef.pbrMetallicRoughness;

    if (metallicRoughness) {
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        const array = metallicRoughness.baseColorFactor;

        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (metallicRoughness.baseColorTexture !== undefined) {
        const format = alphaMode === ALPHA_MODES.OPAQUE ? RGBFormat : RGBAFormat;
        pending.push(
          this.loader.assignTexture(materialParams, "map", metallicRoughness.baseColorTexture, sRGBEncoding, format)
        );
      }
    }

    if (materialDef.doubleSided === true) {
      materialParams.side = DoubleSide;
    }

    if (alphaMode === ALPHA_MODES.BLEND) {
      materialParams.transparent = true;
    } else {
      materialParams.transparent = false;

      if (alphaMode === ALPHA_MODES.MASK) {
        materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
      }
    }

    await Promise.all(pending);

    return materialParams;
  };

  createMaterial = async (materialDef, materialParams) => new MeshBasicMaterial(materialParams);
}
