import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import VideoNode from "../../editor/nodes/VideoNode";
import ImageNode from "../../editor/nodes/ImageNode";
import ModelNode from "../../editor/nodes/ModelNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import AssetContextMenu from "./AssetContextMenu";
import ProjectAssetContextMenu from "./ProjectAssetContextMenu";

const assetTypeToNode = {
  image: ImageNode,
  video: VideoNode,
  model: ModelNode
};

class AssetsLibrary extends Component {
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
          value: "assets",
          label: "My Assets",
          typeOptions: [
            { label: "Models", value: "model" },
            { label: "Images", value: "image" },
            { label: "Videos", value: "video" }
          ],
          typeIsClearable: true,
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
          typeOptions: [
            { label: "Models", value: "model" },
            { label: "Images", value: "image" },
            { label: "Videos", value: "video" }
          ],
          typeIsClearable: true,
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
    const nodeType = assetTypeToNode[item.type];

    if (nodeType) {
      const props = { src: item.url };

      if (item.name) {
        props.name = item.name;
      }

      this.props.onSelectItem(nodeType, props, item, source);
    }
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

export default withApi(withEditor(AssetsLibrary));
