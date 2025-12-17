import ModelMediaSource from "../ModelMediaSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class IcosaSource extends ModelMediaSource {
  constructor(api) {
    super(api);
    this.id = "icosa";
    this.name = "Icosa Gallery";
    this.tags = [
      { label: "Animals & Pets", value: "animals" },
      { label: "Architecture", value: "architecture" },
      { label: "Art", value: "art" },
      { label: "Culture", value: "culture" },
      { label: "Events", value: "events" },
      { label: "Food", value: "food" },
      { label: "History", value: "history" },
      { label: "Home", value: "home" },
      { label: "Miscellaneous", value: "miscellaneous" },
      { label: "Nature", value: "nature" },
      { label: "Objects", value: "objects" },
      { label: "People", value: "people" },
      { label: "Places", value: "places" },
      { label: "Science", value: "science" },
      { label: "Sports", value: "sports" },
      { label: "Tech", value: "tech" },
      { label: "Transport", value: "transport" },
      { label: "Travel", value: "travel" }
    ];

    this.searchLegalCopy = "Search by Icosa";
    this.privacyPolicyUrl = "https://icosa.gallery/privacy-policy";
    this.transformPivot = TransformPivot.Bottom;
  }
}