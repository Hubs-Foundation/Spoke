import ModelMediaSource from "../ModelMediaSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class IcosaSource extends ModelMediaSource {
  constructor(api) {
    super(api);
    this.id = "icosa";
    this.name = "Icosa Gallery";
    this.tags = [
      { label: "Featured", value: "" },
      { label: "Animals", value: "animals" },
      { label: "Architecture", value: "architecture" },
      { label: "Art", value: "art" },
      { label: "Food", value: "food" },
      { label: "Nature", value: "nature" },
      { label: "Objects", value: "objects" },
      { label: "People", value: "people" },
      { label: "Scenes", value: "scenes" },
      { label: "Transport", value: "transport" }
    ];

    this.searchLegalCopy = "Search by Icosa";
    this.privacyPolicyUrl = "https://icosa.gallery/privacy";
    this.transformPivot = TransformPivot.Bottom;
  }
}