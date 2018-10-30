import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../InputGroup";
import ColorInput from "../inputs/ColorInput";
import BooleanInput from "../inputs/BooleanInput";
import CompoundNumericInput from "../inputs/CompoundNumericInput";

export default class PointLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-lightbulb";

  onChangeColor = color => {
    this.props.editor.setNodeProperty(this.props.node, "color", color);
  };

  onChangeIntensity = intensity => {
    this.props.editor.setNodeProperty(this.props.node, "intensity", intensity);
  };

  onChangeCastShadow = castShadow => {
    this.props.editor.setNodeProperty(this.props.node, "castShadow", castShadow);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description="A light which emits in all directions from a single point.">
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <InputGroup name="Intensity">
          <CompoundNumericInput value={node.intensity} onChange={this.onChangeIntensity} />
        </InputGroup>
        <InputGroup name="Cast Shadow">
          <BooleanInput value={node.castShadow} onChange={this.onChangeCastShadow} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
