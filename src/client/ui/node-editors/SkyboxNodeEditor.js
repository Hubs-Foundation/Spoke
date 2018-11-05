import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../InputGroup";
import NumericInput from "../inputs/NumericInput";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import THREE from "../../editor/three";

const { degToRad, radToDeg } = THREE.Math;

export default class SkyboxNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-cloud";

  onChangeTurbidity = turbidity => {
    this.props.editor.setNodeProperty(this.props.node, "turbidity", turbidity);
  };

  onChangeRayleigh = rayleigh => {
    this.props.editor.setNodeProperty(this.props.node, "rayleigh", rayleigh);
  };

  onChangeLuminance = luminance => {
    this.props.editor.setNodeProperty(this.props.node, "luminance", luminance);
  };

  onChangeMieCoefficient = mieCoefficient => {
    this.props.editor.setNodeProperty(this.props.node, "mieCoefficient", mieCoefficient);
  };

  onChangeMieDirectionalG = mieDirectionalG => {
    this.props.editor.setNodeProperty(this.props.node, "mieDirectionalG", mieDirectionalG);
  };

  onChangeInclination = inclination => {
    this.props.editor.setNodeProperty(this.props.node, "inclination", inclination);
  };

  onChangeAzimuth = azimuth => {
    this.props.editor.setNodeProperty(this.props.node, "azimuth", azimuth);
  };

  onChangeDistance = distance => {
    this.props.editor.setNodeProperty(this.props.node, "distance", distance);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor
        description="Creates a visualization of an open sky and atmosphere around your scene."
        {...this.props}
      >
        <InputGroup name="Turbidity">
          <CompoundNumericInput min={1} max={20} value={node.turbidity} onChange={this.onChangeTurbidity} />
        </InputGroup>
        <InputGroup name="Rayleigh">
          <CompoundNumericInput min={0} max={4} value={node.rayleigh} onChange={this.onChangeRayleigh} />
        </InputGroup>
        <InputGroup name="Luminance">
          <CompoundNumericInput min={0} max={2} value={node.luminance} onChange={this.onChangeLuminance} />
        </InputGroup>
        <InputGroup name="MIE Coefficient">
          <CompoundNumericInput min={0} max={0.1} value={node.mieCoefficient} onChange={this.onChangeMieCoefficient} />
        </InputGroup>
        <InputGroup name="MIE Directional G">
          <CompoundNumericInput min={0} max={1} value={node.mieDirectionalG} onChange={this.onChangeMieDirectionalG} />
        </InputGroup>
        <InputGroup name="Inclination">
          <NumericInput
            smallStep={1}
            mediumStep={15}
            bigStep={30}
            value={node.inclination}
            onChange={this.onChangeInclination}
            format={radToDeg}
            parse={degToRad}
          />
        </InputGroup>
        <InputGroup name="Azimuth">
          <NumericInput
            smallStep={1}
            mediumStep={15}
            bigStep={30}
            value={node.azimuth}
            onChange={this.onChangeAzimuth}
            format={radToDeg}
            parse={degToRad}
          />
        </InputGroup>
        <InputGroup name="Distance">
          <NumericInput
            smallStep={10}
            mediumStep={100}
            bigStep={250}
            min={0}
            value={node.distance}
            onChange={this.onChangeDistance}
          />
        </InputGroup>
      </NodeEditor>
    );
  }
}
