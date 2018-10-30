import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class SpawnPointNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-street-view";

  render() {
    return (
      <NodeEditor
        description="A point where people will appear when they enter your scene.\nThe icon in the Viewport represents the actual size of an avatar."
        {...this.props}
      />
    );
  }
}
