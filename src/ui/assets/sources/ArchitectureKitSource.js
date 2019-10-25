import KitSource from "../KitSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class ArchitectureKitSource extends KitSource {
  constructor() {
    super("https://assets-prod.reticulum.io/kits/architecture/ArchKit-6969272253db32f65c0bf6327a73f471edfdb1ad.gltf");
    this.id = "architecture-kit";
    this.name = "Architecture Kit";
    this.experimental = true;
    this.transformPivot = TransformPivot.Selection;
  }
}
