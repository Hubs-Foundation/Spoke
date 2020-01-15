import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Globe } from "styled-icons/fa-solid/Globe";
import NumericInputGroup from "../inputs/NumericInputGroup";
import ColorInput from "../inputs/ColorInput";
import BooleanInput from "../inputs/BooleanInput";
import InputGroup from "../inputs/InputGroup";

export default class SceneNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Globe;

  static description = "The root object of the scene.";

  onChangeFogEnabled = fogEnabled => {
    this.props.editor.setPropertySelected("fogEnabled", fogEnabled);
  };

  onChangeFogColor = fogColor => {
    this.props.editor.setPropertySelected("fogColor", fogColor);
  };

  onChangeFogDensity = fogDensity => {
    this.props.editor.setPropertySelected("fogDensity", fogDensity);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={SceneNodeEditor.description}>
        <InputGroup name="Fog Enabled">
          <BooleanInput value={node.fogEnabled} onChange={this.onChangeFogEnabled} />
        </InputGroup>
        <InputGroup name="Fog Color">
          <ColorInput disabled={!node.fogEnabled} value={node.fogColor} onChange={this.onChangeFogColor} />
        </InputGroup>
        <NumericInputGroup
          name="Fog Density"
          disabled={!node.fogEnabled}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          min={0}
          value={node.fogDensity}
          onChange={this.onChangeFogDensity}
        />
      </NodeEditor>
    );
  }
}
