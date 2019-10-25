import KitSource from "../KitSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class ArchitectureKitSource extends KitSource {
  constructor() {
    super("https://assets-prod.reticulum.io/kits/architecture/ArchKit-191b8dd9b4234ded40b70a31940fb064bbdd3ecc.gltf");
    this.id = "architecture-kit";
    this.name = "Architecture Kit";
    this.experimental = true;
    this.transformPivot = TransformPivot.Selection;
  }
}
