import React, { Component } from "react";
import PropTypes from "prop-types";
import ImageNode from "../../editor/nodes/ImageNode";
import MediaSearchPanel from "./MediaSearchPanel";

export default class ImagesLibrary extends Component {
  static propTypes = {
    onSelectItem: PropTypes.func.isRequired
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
    this.props.onSelectItem(ImageNode, { src: item.url });
  };

  render() {
    return <MediaSearchPanel onSelect={this.onSelect} sources={this.state.sources} />;
  }
}
