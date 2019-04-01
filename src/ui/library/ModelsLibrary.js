import React, { Component } from "react";
import PropTypes from "prop-types";
import ModelNode from "../../editor/nodes/ModelNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";

class ModelsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    uploadMultiple: PropTypes.bool,
    onAfterUpload: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      sources: [
        {
          value: "sketchfab",
          label: "Sketchfab",
          defaultFilter: "featured",
          filterOptions: [
            { label: "Featured", value: "featured" },
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
          ],
          filterIsClearable: true,
          searchPlaceholder: "Search models...",
          legal: "Search by Sketchfab",
          privacyPolicyUrl: "https://sketchfab.com/privacy"
        },
        {
          value: "poly",
          label: "Google Poly",
          filterOptions: [
            { label: "Animals", value: "animals" },
            { label: "Architecture", value: "architecture" },
            { label: "Art", value: "art" },
            { label: "Food", value: "food" },
            { label: "Nature", value: "nature" },
            { label: "Objects", value: "objects" },
            { label: "People", value: "people" },
            { label: "Scenes", value: "scenes" },
            { label: "Transport", value: "transport" }
          ],
          filterIsClearable: true,
          searchPlaceholder: "Search models...",
          legal: "Search by Google",
          privacyPolicyUrl: "https://policies.google.com/privacy"
        },
        {
          value: "project_assets",
          label: "Project Assets",
          defaultType: "model",
          typeOptions: [{ label: "Models", value: "model" }],
          searchPlaceholder: "Search project assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          onSearch: (source, params) => props.api.getProjectAssets(props.editor.projectId, params),
          upload: true
        },
        {
          value: "assets",
          label: "Assets",
          defaultType: "model",
          typeOptions: [{ label: "Models", value: "model" }],
          searchPlaceholder: "Search my assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          upload: true
        }
      ]
    };
  }

  onSelect = item => {
    const props = { src: item.url };

    if (item.name) {
      props.name = item.name;
    }

    this.props.onSelectItem(ModelNode, props);
  };

  render() {
    return (
      <LibrarySearchContainer
        sources={this.state.sources}
        onSelect={this.onSelect}
        uploadMultiple={this.props.uploadMultiple}
        onAfterUpload={this.props.onAfterUpload}
      />
    );
  }
}

export default withApi(withEditor(ModelsLibrary));
