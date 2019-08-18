import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInputGroup from "../inputs/NumericInputGroup";

export default class HemisphereLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-certificate";

  static description = "A light which illuminates the scene from directly overhead.";

  onChangeSkyColor = skyColor => {
    this.props.editor.setProperty(this.props.node, "skyColor", skyColor);
  };

  onChangeGroundColor = groundColor => {
    this.props.editor.setProperty(this.props.node, "groundColor", groundColor);
  };

  onChangeIntensity = intensity => {
    this.props.editor.setProperty(this.props.node, "intensity", intensity);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={HemisphereLightNodeEditor.description}>
        <InputGroup name="Sky Color">
          <ColorInput value={node.skyColor} onChange={this.onChangeSkyColor} />
        </InputGroup>
        <InputGroup name="Ground Color">
          <ColorInput value={node.groundColor} onChange={this.onChangeGroundColor} />
        </InputGroup>
        <NumericInputGroup
          name="Intensity"
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={node.intensity}
          onChange={this.onChangeIntensity}
          unit="cd"
        />
      </NodeEditor>
    );
  }
}
