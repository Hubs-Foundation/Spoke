import React, { Component } from "react";
import { withEditor } from "../contexts/EditorContext";
import PropTypes from "prop-types";
import ImageNode from "../../editor/nodes/ImageNode";
import MediaSearchPanel from "./MediaSearchPanel";

class ImagesLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
  };

  state = {
    sources: [
      {
        id: "bing_images",
        label: "Images",
        placeholder: "Search images...",
        legal: "Search by Bing",
        privacyPolicyUrl: "https://privacy.microsoft.com/en-us/privacystatement"
      },
      {
        id: "tenor",
        label: "Gifs",
        placeholder: "Search gifs...",
        defaultFilter: "trending",
        filters: ["trending"],
        legal: "Search by Tenor",
        privacyPolicyUrl: "https://tenor.com/legal-privacy"
      }
    ]
  };

  onSelect = item => {
    const editor = this.props.editor;
    const node = new ImageNode(editor);
    node.src = item.url;
    editor.addObject(node);
  };

  render() {
    return <MediaSearchPanel onSelect={this.onSelect} sources={this.state.sources} />;
  }
}

export default withEditor(ImagesLibrary);
