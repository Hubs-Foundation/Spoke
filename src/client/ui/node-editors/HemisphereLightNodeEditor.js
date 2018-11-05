import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInput from "../inputs/NumericInput";

export default class HemisphereLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-certificate";

  onChangeSkyColor = skyColor => {
    this.props.editor.setNodeProperty(this.props.node, "skyColor", skyColor);
  };

  onChangeGroundColor = groundColor => {
    this.props.editor.setNodeProperty(this.props.node, "groundColor", groundColor);
  };

  onChangeIntensity = intensity => {
    this.props.editor.setNodeProperty(this.props.node, "intensity", intensity);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description="A light which illuminates the scene from directly overhead.">
        <InputGroup name="Sky Color">
          <ColorInput value={node.skyColor} onChange={this.onChangeSkyColor} />
        </InputGroup>
        <InputGroup name="Ground Color">
          <ColorInput value={node.groundColor} onChange={this.onChangeGroundColor} />
        </InputGroup>
        <InputGroup name="Intensity">
          <NumericInput min={0} value={node.intensity} onChange={this.onChangeIntensity} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
