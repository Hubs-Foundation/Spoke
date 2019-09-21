import kitUrl from "../../../assets/kits/KitTesting/KitTesting.gltf";
import KitSource from "../KitSource";

export default class ArchitectureKitSource extends KitSource {
  constructor() {
    super(kitUrl);
    this.id = "architecture-kit";
    this.name = "Architecture Kit";
  }
}
