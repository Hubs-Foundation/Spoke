import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import LightShadowProperties from "./LightShadowProperties";
import { Bolt } from "styled-icons/fa-solid/Bolt";

export default class DirectionalLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Bolt;

  static description = "A light which illuminates the entire scene, but emits along a single direction.";

  onChangeColor = color => {
    this.props.editor.setPropertySelected("color", color);
  };

  onChangeIntensity = intensity => {
    this.props.editor.setPropertySelected("intensity", intensity);
  };

  render() {
    const { node, editor } = this.props;

    return (
      <NodeEditor {...this.props} description={DirectionalLightNodeEditor.description}>
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
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
        <LightShadowProperties node={node} editor={editor} />
      </NodeEditor>
    );
  }
}
