import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Water } from "styled-icons/fa-solid/Water";

export default class SimpleWaterNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Water;

  static description = "Renders a water plane.";

  render() {
    return <NodeEditor {...this.props} description={SimpleWaterNodeEditor.description} />;
  }
}
