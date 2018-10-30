import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class SpotLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-bullseye";

  render() {
    return (
      <NodeEditor
        description="A light which emits along a direction, illuminating objects within a cone."
        {...this.props}
      />
    );
  }
}
