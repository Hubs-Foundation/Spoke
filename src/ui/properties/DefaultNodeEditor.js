import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Circle } from "styled-icons/fa-solid/Circle";

export default class DefaultNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Circle;

  render() {
    return <NodeEditor {...this.props} />;
  }
}
