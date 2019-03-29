import React, { Component } from "react";
import PropTypes from "prop-types";
import VideoNode from "../../editor/nodes/VideoNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
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
          searchPlaceholder: "Search videos...",
          legal: "Search by Bing",
          privacyPolicyUrl: "https://privacy.microsoft.com/en-us/privacystatement"
        },
        {
          value: "twitch",
          label: "Twitch",
          searchPlaceholder: "Search channels...",
          legal: "Search by Twitch",
          privacyPolicyUrl: "https://www.twitch.tv/p/legal/privacy-policy/"
        },
        {
          value: "tenor",
          label: "GIFs",
          defaultFilter: "trending",
          filterOptions: [{ label: "Trending", id: "trending" }],
          filterIsClearable: true,
          searchPlaceholder: "Search gifs...",
          legal: "Search by Tenor",
          privacyPolicyUrl: "https://tenor.com/legal-privacy"
        },
        {
          value: "assets",
          label: "Assets",
          defaultType: "video",
          typeOptions: [{ label: "Videos", value: "video" }],
          searchPlaceholder: "Search my assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          upload: true
        },
        {
          value: "project_assets",
          label: "Project Assets",
          defaultType: "video",
          typeOptions: [{ label: "Videos", value: "video" }],
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
    this.props.onSelectItem(VideoNode, { src: item.url });
  };

  render() {
    return <LibrarySearchContainer sources={this.state.sources} onSelect={this.onSelect} />;
  }
}

export default withApi(withEditor(VideosLibrary));
