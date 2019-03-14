import React, { Component } from "react";
import { withEditor } from "../contexts/EditorContext";
import PropTypes from "prop-types";
import VideoNode from "../../editor/nodes/VideoNode";
import MediaSearchPanel from "./MediaSearchPanel";

class VideosLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
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
    const editor = this.props.editor;
    const node = new VideoNode(editor);
    node.src = item.url;
    editor.addObject(node);
  };

  render() {
    return <MediaSearchPanel onSelect={this.onSelect} sources={this.state.sources} />;
  }
}

export default withEditor(VideosLibrary);
