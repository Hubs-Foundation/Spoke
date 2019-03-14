import React, { Component } from "react";
import { withEditor } from "../contexts/EditorContext";
import PropTypes from "prop-types";
import ModelNode from "../../editor/nodes/ModelNode";
import MediaSearchPanel from "./MediaSearchPanel";

class ModelsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
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
    const editor = this.props.editor;
    const node = new ModelNode(editor);
    node.src = item.url;
    editor.addObject(node);
  };

  render() {
    return <MediaSearchPanel onSelect={this.onSelect} sources={this.state.sources} />;
  }
}

export default withEditor(ModelsLibrary);
