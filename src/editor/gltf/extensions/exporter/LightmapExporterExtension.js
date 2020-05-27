import { ExporterExtension } from "./ExporterExtension";

export class LightmapExporterExtension extends ExporterExtension {
  onRegister() {
    this.exporter.addHook(
      "addMaterialProperties",
      () => true,
      (material, materialDef) => {
        if (material.lightMap) {
          materialDef.extensions.MOZ_lightmap = {
            index: this.exporter.processTexture(material.lightMap),
            texCoord: 1
          };
          this.exporter.extensionsUsed.MOZ_lightmap = true;
        }
      }
    );
  }
}
