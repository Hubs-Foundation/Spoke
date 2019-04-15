import React, { Component } from "react";
import PropTypes from "prop-types";
import ModelNode from "../../editor/nodes/ModelNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import AssetContextMenu from "./AssetContextMenu";
import ProjectAssetContextMenu from "./ProjectAssetContextMenu";

class ModelsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    uploadMultiple: PropTypes.bool,
    onAfterUpload: PropTypes.func,
    tooltipId: PropTypes.string
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
          privacyPolicyUrl: "https://sketchfab.com/privacy",
          onSearch: (...args) => props.api.searchMedia(...args)
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
          privacyPolicyUrl: "https://policies.google.com/privacy",
          onSearch: (...args) => props.api.searchMedia(...args)
        },
        {
          value: "assets",
          label: "My Assets",
          defaultType: "model",
          typeOptions: [{ label: "Models", value: "model" }],
          searchPlaceholder: "Search my assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          onSearch: (...args) => props.api.searchMedia(...args),
          onUpload: (...args) => props.api.uploadAssets(props.editor, ...args),
          contextMenu: AssetContextMenu
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
          onUpload: (...args) => props.api.uploadProjectAssets(props.editor, props.editor.projectId, ...args),
          contextMenu: ProjectAssetContextMenu
        }
      ]
    };
  }

  onSelect = (item, source) => {
    const props = { src: item.url };

    if (item.name) {
      props.name = item.name;
    }

    this.props.onSelectItem(ModelNode, props, item, source);
  };

  render() {
    return (
      <LibrarySearchContainer
        sources={this.state.sources}
        onSelect={this.onSelect}
        uploadMultiple={this.props.uploadMultiple}
        onAfterUpload={this.props.onAfterUpload}
        tooltipId={this.props.tooltipId}
      />
    );
  }
}

export default withApi(withEditor(ModelsLibrary));
