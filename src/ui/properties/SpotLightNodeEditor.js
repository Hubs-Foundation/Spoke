import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import RadianNumericInputGroup from "../inputs/RadianNumericInputGroup";
import THREE from "../../vendor/three";
import LightShadowProperties from "./LightShadowProperties";

const radToDeg = THREE.Math.radToDeg;

export default class SpotLightNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-bullseye";

  static description = "A light which emits along a direction, illuminating objects within a cone.";

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
      <NodeEditor {...this.props} description={SpotLightNodeEditor.description}>
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <NumericInputGroup name="Intensity" min={0} value={node.intensity} onChange={this.onChangeIntensity} unit="°" />
        <RadianNumericInputGroup
          name="Inner Cone Angle"
          min={0}
          max={radToDeg(node.outerConeAngle)}
          value={node.innerConeAngle}
          onChange={this.onChangeInnerConeAngle}
          unit="°"
        />
        <RadianNumericInputGroup
          name="Outer Cone Angle"
          min={radToDeg(node.innerConeAngle + 0.00001)}
          max={radToDeg(node.maxOuterConeAngle)}
          value={node.outerConeAngle}
          onChange={this.onChangeOuterConeAngle}
          unit="°"
        />
        <NumericInputGroup name="Range" min={0} value={node.range} onChange={this.onChangeRange} unit="m" />
        <LightShadowProperties node={node} editor={editor} />
      </NodeEditor>
    );
  }
}
