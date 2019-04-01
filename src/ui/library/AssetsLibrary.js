import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import VideoNode from "../../editor/nodes/VideoNode";
import ImageNode from "../../editor/nodes/ImageNode";
import ModelNode from "../../editor/nodes/ModelNode";
import LibrarySearchContainer from "./LibrarySearchContainer";

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
    onAfterUpload: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      sources: [
        {
          value: "assets",
          label: "Assets",
          typeOptions: [
            { label: "Models", value: "model" },
            { label: "Images", value: "image" },
            { label: "Videos", value: "video" }
          ],
          typeIsClearable: true,
          searchPlaceholder: "Search my assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          upload: true
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
          upload: true
        }
      ]
    };
  }

  onSelect = item => {
    const nodeType = assetTypeToNode[item.type];

    if (nodeType) {
      const props = { src: item.url };

      if (item.name) {
        props.name = item.name;
      }

      this.props.onSelectItem(nodeType, props);
    }
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

export default withApi(withEditor(AssetsLibrary));
