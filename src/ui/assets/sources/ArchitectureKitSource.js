import KitSource from "../KitSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class ArchitectureKitSource extends KitSource {
  constructor(api) {
    super(
      api,
      "https://assets-prod.reticulum.io/kits/architecture/ArchKit-64274f78e194a993850e208cbaa2fe7c5a35a955.gltf"
    );
    this.id = "architecture-kit";
    this.name = "Architecture Kit";
    this.transformPivot = TransformPivot.Selection;
    // Images take a while to load so we set a debounce timeout
    this.searchDebounceTimeout = 500;
  }
}
