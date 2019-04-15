import React, { Component } from "react";
import PropTypes from "prop-types";
import ImageNode from "../../editor/nodes/ImageNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import AssetContextMenu from "./AssetContextMenu";
import ProjectAssetContextMenu from "./ProjectAssetContextMenu";

class ImagesLibrary extends Component {
  static propTypes = {
    onSelectItem: PropTypes.func.isRequired,
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    uploadMultiple: PropTypes.bool,
    onAfterUpload: PropTypes.func,
    tooltipId: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.state = {
      sources: [
        {
          value: "bing_images",
          label: "Images",
          searchPlaceholder: "Search images...",
          legal: "Search by Bing",
          privacyPolicyUrl: "https://privacy.microsoft.com/en-us/privacystatement",
          onSearch: (...args) => props.api.searchMedia(...args)
        },
        {
          value: "assets",
          label: "My Assets",
          defaultType: "image",
          typeOptions: [{ label: "Images", value: "image" }],
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
          defaultType: "image",
          typeOptions: [{ label: "Images", value: "image" }],
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

    this.props.onSelectItem(ImageNode, props, item, source);
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

export default withApi(withEditor(ImagesLibrary));
