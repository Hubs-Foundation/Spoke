import KitSource from "../KitSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class ShapeKitSource extends KitSource {
  constructor(api) {
    super(api, "http://localhost:5000/ShapeKit-b2b70bfa53db99603bf0a6996005769a514e846a.gltf");
    this.id = "shape-kit";
    this.name = "Shape Kit";
    this.transformPivot = TransformPivot.Selection;
  }
}
