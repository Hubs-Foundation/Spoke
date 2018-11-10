import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class MediaNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-film";

  render() {
    return <NodeEditor description="Dynamically loads a video, image, or 3D model." {...this.props} />;
  }
}
