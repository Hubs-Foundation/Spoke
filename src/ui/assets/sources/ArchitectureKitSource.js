import kitUrl from "../../../assets/kits/TestKit/TestKit.gltf";
import KitSource from "../KitSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class ArchitectureKitSource extends KitSource {
  constructor() {
    super(kitUrl);
    this.id = "architecture-kit";
    this.name = "Architecture Kit";
    this.experimental = true;
    this.transformPivot = TransformPivot.Selection;
  }
}
