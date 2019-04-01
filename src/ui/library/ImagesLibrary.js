import React, { Component } from "react";
import PropTypes from "prop-types";
import ImageNode from "../../editor/nodes/ImageNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";

class ImagesLibrary extends Component {
  static propTypes = {
    onSelectItem: PropTypes.func.isRequired,
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    uploadMultiple: PropTypes.bool,
    onAfterUpload: PropTypes.func
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
          privacyPolicyUrl: "https://privacy.microsoft.com/en-us/privacystatement"
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
          upload: true
        },
        {
          value: "assets",
          label: "Assets",
          defaultType: "image",
          typeOptions: [{ label: "Images", value: "image" }],
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

    this.props.onSelectItem(ImageNode, props);
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

export default withApi(withEditor(ImagesLibrary));
