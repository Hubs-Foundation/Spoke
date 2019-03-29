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
    api: PropTypes.object.isRequired
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
          value: "assets",
          label: "Assets",
          defaultType: "image",
          typeOptions: [{ label: "Images", value: "image" }],
          searchPlaceholder: "Search my assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          upload: true
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
        }
      ]
    };
  }

  onSelect = item => {
    this.props.onSelectItem(ImageNode, { src: item.url });
  };

  render() {
    return <LibrarySearchContainer sources={this.state.sources} onSelect={this.onSelect} />;
  }
}

export default withApi(withEditor(ImagesLibrary));
