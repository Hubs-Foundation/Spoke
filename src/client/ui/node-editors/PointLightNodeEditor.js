import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class PointLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-lightbulb";

  render() {
    return <NodeEditor {...this.props} description="A light which emits in all directions from a single point." />;
  }
}
