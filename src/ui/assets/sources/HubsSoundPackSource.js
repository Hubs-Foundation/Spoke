import AssetManifestSource from "../AssetManifestSource";

export default class HubsSoundPackSource extends AssetManifestSource {
  constructor(editor) {
    super(editor, "Hubs Sound Pack", "https://assets-prod.reticulum.io/hubs-sound-pack/asset-manifest.json");
  }
}
