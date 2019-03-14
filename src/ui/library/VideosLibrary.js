import React, { Component } from "react";
import PropTypes from "prop-types";
import VideoNode from "../../editor/nodes/VideoNode";
import MediaSearchPanel from "./MediaSearchPanel";

export default class VideosLibrary extends Component {
  static propTypes = {
    onSelectItem: PropTypes.func.isRequired
  };

  state = {
    sources: [
      {
        id: "bing_videos",
        label: "Videos",
        placeholder: "Search videos...",
        legal: "Search by Bing",
        privacyPolicyUrl: "https://privacy.microsoft.com/en-us/privacystatement"
      },
      {
        id: "twitch",
        label: "Twitch",
        placeholder: "Search channels...",
        legal: "Search by Twitch",
        privacyPolicyUrl: "https://www.twitch.tv/p/legal/privacy-policy/"
      }
    ]
  };

  onSelect = item => {
    this.props.onSelectItem(VideoNode, { src: item.url });
  };

  render() {
    return <MediaSearchPanel onSelect={this.onSelect} sources={this.state.sources} />;
  }
}
