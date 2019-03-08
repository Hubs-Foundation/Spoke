import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInput from "../inputs/NumericInput";
import LightShadowProperties from "./LightShadowProperties";

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

  onChangeRange = range => {
    this.props.editor.setNodeProperty(this.props.node, "range", range);
  };

  render() {
    const { node, editor } = this.props;

    return (
      <NodeEditor {...this.props} description="A light which emits in all directions from a single point.">
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <InputGroup name="Intensity">
          <NumericInput min={0} value={node.intensity} onChange={this.onChangeIntensity} />
        </InputGroup>
        <InputGroup name="Range">
          <NumericInput min={0} value={node.range} onChange={this.onChangeRange} />
        </InputGroup>
        <LightShadowProperties node={node} editor={editor} />
      </NodeEditor>
    );
  }
}
