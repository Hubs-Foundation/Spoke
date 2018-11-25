import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class ImageNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-image";

  render() {
    return <NodeEditor description="Dynamically loads an image." {...this.props} />;
  }
}
