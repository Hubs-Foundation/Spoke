import ModelMediaSource from "../ModelMediaSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class SketchfabSource extends ModelMediaSource {
  constructor(api) {
    super(api);
    this.id = "sketchfab";
    this.name = "Sketchfab";
    this.tags = [
      { label: "Featured", value: "featured", children: [{ label: "Featured", value: "featured" }] },
      { label: "Animals", value: "animals-pets" },
      { label: "Architecture", value: "architecture" },
      { label: "Art", value: "art-abstract" },
      { label: "Vehicles", value: "cars-vehicles" },
      { label: "Characters", value: "characters-creatures" },
      { label: "Culture", value: "cultural-heritage-history" },
      { label: "Gadgets", value: "electronics-gadgets" },
      { label: "Fashion", value: "fashion-style" },
      { label: "Food", value: "food-drink" },
      { label: "Furniture", value: "furniture-home" },
      { label: "Music", value: "music" },
      { label: "Nature", value: "nature-plants" },
      { label: "News", value: "news-politics" },
      { label: "People", value: "people" },
      { label: "Places", value: "places-travel" },
      { label: "Science", value: "science-technology" },
      { label: "Sports", value: "sports-fitness" },
      { label: "Weapons", value: "weapons-military" }
    ];

    this.searchLegalCopy = "Search by Sketchfab";
    this.privacyPolicyUrl = "https://sketchfab.com/privacy";
    this.transformPivot = TransformPivot.Bottom;
  }
}
