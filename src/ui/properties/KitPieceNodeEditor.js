import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class KitPieceNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-toolbox";

  static description = "";

  render() {
    return <NodeEditor {...this.props} description={KitPieceNodeEditor.description} />;
  }
}
