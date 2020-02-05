import AssetManifestSource from "../AssetManifestSource";

export default class HubsSoundPackSource extends AssetManifestSource {
  constructor(editor) {
    super(editor, "Hubs Sound Pack", "https://assets-dev.reticulum.io/hubs-sound-pack/asset-manifest.json");
  }
}
