import kitUrl from "../../../assets/kits/ArchitectureKit/ArchKitv6.gltf";
import KitSource from "../KitSource";

export default class ArchitectureKitSource extends KitSource {
  constructor() {
    super(kitUrl);
    this.id = "architecture-kit";
    this.name = "Architecture Kit";
  }
}
