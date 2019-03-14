import React, { Component } from "react";
import PropTypes from "prop-types";
import ModelNode from "../../editor/nodes/ModelNode";
import MediaSearchPanel from "./MediaSearchPanel";

export default class ModelsLibrary extends Component {
  static propTypes = {
    onSelectItem: PropTypes.func.isRequired
  };

  state = {
    sources: [
      {
        id: "sketchfab",
        label: "Sketchfab",
        placeholder: "Search models...",
        defaultFilter: "featured",
        filters: ["featured"],
        legal: "Search by Sketchfab",
        privacyPolicyUrl: "https://sketchfab.com/privacy"
      },
      {
        id: "poly",
        label: "Google Poly",
        placeholder: "Search models...",
        legal: "Search by Google",
        privacyPolicyUrl: "https://policies.google.com/privacy"
      }
    ]
  };

  onSelect = item => {
    this.props.onSelectItem(ModelNode, { src: item.url });
  };

  render() {
    return <MediaSearchPanel onSelect={this.onSelect} sources={this.state.sources} />;
  }
}
