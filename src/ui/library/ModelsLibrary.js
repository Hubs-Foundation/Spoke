import React, { Component } from "react";
import PropTypes from "prop-types";
import ModelNode from "../../editor/nodes/ModelNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import FilterSearchToolbar from "./FilterSearchToolbar";
import AssetSearchToolbar from "./AssetSearchToolbar";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";

class ModelsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      sources: [
        {
          value: "sketchfab",
          label: "Sketchfab",
          toolbar: FilterSearchToolbar,
          toolbarProps: {
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
            searchPlaceholder: "Search models...",
            legal: "Search by Sketchfab",
            privacyPolicyUrl: "https://sketchfab.com/privacy"
          }
        },
        {
          value: "poly",
          label: "Google Poly",
          toolbar: FilterSearchToolbar,
          toolbarProps: {
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
            searchPlaceholder: "Search models...",
            legal: "Search by Google",
            privacyPolicyUrl: "https://policies.google.com/privacy"
          }
        },
        {
          value: "assets",
          label: "Assets",
          toolbar: AssetSearchToolbar,
          toolbarProps: {
            defaultFilter: "model",
            filterOptions: [{ label: "Models", value: "model" }],
            searchPlaceholder: "Search my assets...",
            legal: "Search by Mozilla Hubs",
            privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
          }
        },
        {
          value: "project_assets",
          label: "Project Assets",
          toolbar: AssetSearchToolbar,
          toolbarProps: {
            defaultFilter: "model",
            filterOptions: [{ label: "Models", value: "model" }],
            searchPlaceholder: "Search project assets...",
            legal: "Search by Mozilla Hubs",
            privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
          },
          onSearch: (source, params) => props.api.getProjectAssets(props.editor.projectId, params)
        }
      ]
    };
  }

  onSelect = item => {
    this.props.onSelectItem(ModelNode, { src: item.url });
  };

  render() {
    return <LibrarySearchContainer sources={this.state.sources} onSelect={this.onSelect} />;
  }
}

export default withApi(withEditor(ModelsLibrary));
