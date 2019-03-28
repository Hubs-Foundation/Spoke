import React, { Component } from "react";
import PropTypes from "prop-types";
import VideoNode from "../../editor/nodes/VideoNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import BaseSearchToolbar from "./BaseSearchToolbar";
import AssetSearchToolbar from "./AssetSearchToolbar";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";

class VideosLibrary extends Component {
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
          value: "bing_videos",
          label: "Videos",
          toolbar: BaseSearchToolbar,
          toolbarProps: {
            searchPlaceholder: "Search videos...",
            legal: "Search by Bing",
            privacyPolicyUrl: "https://privacy.microsoft.com/en-us/privacystatement"
          }
        },
        {
          value: "twitch",
          label: "Twitch",
          toolbar: BaseSearchToolbar,
          toolbarProps: {
            searchPlaceholder: "Search channels...",
            legal: "Search by Twitch",
            privacyPolicyUrl: "https://www.twitch.tv/p/legal/privacy-policy/"
          }
        },
        {
          value: "assets",
          label: "Assets",
          toolbar: AssetSearchToolbar,
          toolbarProps: {
            defaultFilter: "video",
            filterOptions: [{ label: "Videos", value: "video" }],
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
            defaultFilter: "video",
            filterOptions: [{ label: "Videos", value: "video" }],
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
    this.props.onSelectItem(VideoNode, { src: item.url });
  };

  render() {
    return <LibrarySearchContainer sources={this.state.sources} onSelect={this.onSelect} />;
  }
}

export default withApi(withEditor(VideosLibrary));
