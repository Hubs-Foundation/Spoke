import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class BoxColliderNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-hand-paper";

  render() {
    return (
      <NodeEditor
        {...this.props}
        description="An invisible box that objects will bounce off of or rest on top of.\nWithout colliders, objects will fall through floors and go through walls."
      />
    );
  }
}
