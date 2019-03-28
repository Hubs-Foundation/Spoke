import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import VideoNode from "../../editor/nodes/VideoNode";
import ImageNode from "../../editor/nodes/ImageNode";
import ModelNode from "../../editor/nodes/ModelNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import AssetSearchToolbar from "./AssetSearchToolbar";

const assetTypeToNode = {
  image: ImageNode,
  video: VideoNode,
  model: ModelNode
};

class AssetsLibrary extends Component {
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
          value: "assets",
          label: "Assets",
          toolbar: AssetSearchToolbar,
          toolbarProps: {
            defaultFilter: "all",
            filterOptions: [
              { label: "All", value: "all" },
              { label: "Models", value: "model" },
              { label: "Images", value: "image" },
              { label: "Videos", value: "video" }
            ],
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
            defaultFilter: "all",
            filterOptions: [
              { label: "All", value: "all" },
              { label: "Models", value: "model" },
              { label: "Images", value: "image" },
              { label: "Videos", value: "video" }
            ],
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
    const nodeType = assetTypeToNode[item.type];

    if (nodeType) {
      this.props.onSelectItem(nodeType, { src: item.url });
    }
  };

  render() {
    return <LibrarySearchContainer sources={this.state.sources} onSelect={this.onSelect} />;
  }
}

export default withApi(withEditor(AssetsLibrary));
