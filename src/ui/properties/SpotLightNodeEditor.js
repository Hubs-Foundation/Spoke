import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInput from "../inputs/NumericInput";
import THREE from "../../vendor/three";
import LightShadowProperties from "./LightShadowProperties";

const { degToRad, radToDeg } = THREE.Math;

export default class SpotLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-bullseye";

  onChangeColor = color => {
    this.props.editor.setNodeProperty(this.props.node, "color", color);
  };

  onChangeIntensity = intensity => {
    this.props.editor.setNodeProperty(this.props.node, "intensity", intensity);
  };

  onChangeInnerConeAngle = innerConeAngle => {
    this.props.editor.setNodeProperty(this.props.node, "innerConeAngle", innerConeAngle);
  };

  onChangeOuterConeAngle = outerConeAngle => {
    this.props.editor.setNodeProperty(this.props.node, "outerConeAngle", outerConeAngle);
  };

  onChangeRange = range => {
    this.props.editor.setNodeProperty(this.props.node, "range", range);
  };

  render() {
    const { node, editor } = this.props;

    return (
      <NodeEditor
        {...this.props}
        description="A light which emits along a direction, illuminating objects within a cone."
      >
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <InputGroup name="Intensity">
          <NumericInput min={0} value={node.intensity} onChange={this.onChangeIntensity} />
        </InputGroup>
        <InputGroup name="Inner Cone Angle">
          <NumericInput
            min={0}
            value={node.innerConeAngle}
            onChange={this.onChangeInnerConeAngle}
            format={radToDeg}
            parse={degToRad}
          />
        </InputGroup>
        <InputGroup name="Outer Cone Angle">
          <NumericInput
            min={0}
            value={node.outerConeAngle}
            onChange={this.onChangeOuterConeAngle}
            format={radToDeg}
            parse={degToRad}
          />
        </InputGroup>
        <InputGroup name="Range">
          <NumericInput min={0} value={node.range} onChange={this.onChangeRange} />
        </InputGroup>
        <LightShadowProperties node={node} editor={editor} />
      </NodeEditor>
    );
  }
}
