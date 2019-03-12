import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class LinkNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-link";

  render() {
    return <NodeEditor description="Link to another webpage or Hubs room." {...this.props} />;
  }
}
