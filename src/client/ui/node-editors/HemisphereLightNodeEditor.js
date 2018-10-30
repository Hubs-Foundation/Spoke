import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class HemisphereLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-certificate";

  render() {
    return <NodeEditor {...this.props} description="A light which illuminates the scene from directly overhead." />;
  }
}
