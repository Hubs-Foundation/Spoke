import { sRGBEncoding, RGBFormat } from "three";
import { LoaderExtension } from "./LoaderExtension";

function getLightmap(materialDef) {
  return materialDef.extensions && materialDef.extensions[LightmapLoaderExtension.extensionName];
}

function shouldSetMaterialParams(_material, materialDef) {
  return getLightmap(materialDef);
}

export class LightmapLoaderExtension extends LoaderExtension {
  static extensionName = "MOZ_lightmap";

  extensionNames = [LightmapLoaderExtension.extensionName];

  onLoad() {
    if (this.loader.usesExtension(LightmapLoaderExtension.extensionName)) {
      this.loader.addHook("setMaterialParams", shouldSetMaterialParams, this.setMaterialParams);
    }
  }

  setMaterialParams = async (material, materialDef) => {
    const lightmap = getLightmap(materialDef);

    if (lightmap) {
      material.lightMapIntensity = lightmap.intensity === undefined ? 1 : lightmap.intensity;
      await this.loader.assignTexture(material, "lightMap", lightmap, sRGBEncoding, RGBFormat);
    }
  };
}
