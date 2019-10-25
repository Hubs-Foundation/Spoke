import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import NumericInputGroup from "../inputs/NumericInputGroup";
import RadianNumericInputGroup from "../inputs/RadianNumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import { Cloud } from "styled-icons/fa-solid/Cloud";

const hoursToRadians = hours => hours / 24;
const radiansToHours = rads => rads * 24;

export default class SkyboxNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Cloud;

  static description =
    "Creates a visualization of an open sky and atmosphere around your scene. Also used as the environment map for your scene.";

  onChangeTurbidity = turbidity => {
    this.props.editor.setPropertySelected("turbidity", turbidity);
  };

  onChangeRayleigh = rayleigh => {
    this.props.editor.setPropertySelected("rayleigh", rayleigh);
  };

  onChangeLuminance = luminance => {
    this.props.editor.setPropertySelected("luminance", luminance);
  };

  onChangeMieCoefficient = mieCoefficient => {
    this.props.editor.setPropertySelected("mieCoefficient", mieCoefficient);
  };

  onChangeMieDirectionalG = mieDirectionalG => {
    this.props.editor.setPropertySelected("mieDirectionalG", mieDirectionalG);
  };

  onChangeInclination = inclination => {
    this.props.editor.setPropertySelected("inclination", inclination);
  };

  onChangeAzimuth = azimuth => {
    this.props.editor.setPropertySelected("azimuth", azimuth);
  };

  onChangeDistance = distance => {
    this.props.editor.setPropertySelected("distance", distance);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor description={SkyboxNodeEditor.description} {...this.props}>
        <NumericInputGroup
          name="Time of Day"
          smallStep={0.1}
          mediumStep={0.5}
          largeStep={1}
          min={0}
          max={24}
          convertFrom={radiansToHours}
          convertTo={hoursToRadians}
          value={node.azimuth}
          onChange={this.onChangeAzimuth}
          unit="h"
        />
        <RadianNumericInputGroup
          name="Latitude"
          min={-90}
          max={90}
          smallStep={0.1}
          mediumStep={0.5}
          largeStep={1}
          value={node.inclination}
          onChange={this.onChangeInclination}
        />
        <InputGroup name="Luminance">
          <CompoundNumericInput
            min={0.001}
            max={1.189}
            step={0.001}
            value={node.luminance}
            onChange={this.onChangeLuminance}
          />
        </InputGroup>
        <InputGroup name="Scattering Amount">
          <CompoundNumericInput
            min={0}
            max={0.1}
            step={0.001}
            value={node.mieCoefficient}
            onChange={this.onChangeMieCoefficient}
          />
        </InputGroup>
        <InputGroup name="Scattering Distance">
          <CompoundNumericInput
            min={0}
            max={1}
            step={0.001}
            value={node.mieDirectionalG}
            onChange={this.onChangeMieDirectionalG}
          />
        </InputGroup>
        <InputGroup name="Horizon Start">
          <CompoundNumericInput min={1} max={20} value={node.turbidity} onChange={this.onChangeTurbidity} />
        </InputGroup>
        <InputGroup name="Horizon End">
          <CompoundNumericInput min={0} max={4} value={node.rayleigh} onChange={this.onChangeRayleigh} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
