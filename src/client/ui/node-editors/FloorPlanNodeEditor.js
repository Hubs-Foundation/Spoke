import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class FloorPlanNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-shoe-prints";

  render() {
    return <NodeEditor {...this.props} description="Sets the walkable surface area in your scene." />;
  }
}
