import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInput from "../inputs/NumericInput";

export default class AmbientLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-sun";

  static description = "A light which illuminates all objects in your scene.";

  onChangeColor = color => {
    this.props.editor.setNodeProperty(this.props.node, "color", color);
  };

  onChangeIntensity = intensity => {
    this.props.editor.setNodeProperty(this.props.node, "intensity", intensity);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={AmbientLightNodeEditor.description}>
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <InputGroup name="Intensity">
          <NumericInput min={0} value={node.intensity} onChange={this.onChangeIntensity} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
