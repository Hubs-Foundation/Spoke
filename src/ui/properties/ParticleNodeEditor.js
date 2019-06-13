import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";
import ImageInput from "../inputs/ImageInput";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import Vector3Input from "../inputs/Vector3Input";
import SelectInput from "../inputs/SelectInput";

const CurveOptions = [
  {
    label: "Linear",
    value: 0
  },
  {
    label: "Power",
    value: 1
  },
  {
    label: "Smoothstep",
    value: 2
  }
];

export default class ParticleNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-spray-can";

  static description = "Particles with maximum number 1000.";

  onChangeCurve = curve => {
    this.props.editor.setNodeProperty(this.props.node, "curve", curve);
  };

  onChangeStartColor = startColor => {
    this.props.editor.setNodeProperty(this.props.node, "startColor", startColor);
  };

  onChangeEndColor = endColor => {
    this.props.editor.setNodeProperty(this.props.node, "endColor", endColor);
  };

  onChangeStartaOpacity = startOpacity => {
    this.props.editor.setNodeProperty(this.props.node, "startOpacity", startOpacity);
  };

  onChangeEndOpacity = endOpacity => {
    this.props.editor.setNodeProperty(this.props.node, "endOpacity", endOpacity);
  };

  onChangeSrc = src => {
    this.props.editor.setNodeProperty(this.props.node, "src", src);
  };

  onChangeSize = size => {
    this.props.editor.setNodeProperty(this.props.node, "size", size);
  };

  onChangeVelocity = velocity => {
    this.props.editor.setNodeProperty(this.props.node, "velocity", velocity);
  };

  onCommitParticleCount = particleCount => {
    this.props.editor.setNodeProperty(this.props.node, "particleCount", particleCount);
    this.props.node.createParticle();
  };

  onChangeParticleCount = particleCount => {
    this.props.editor.setNodeProperty(this.props.node, "particleCount", particleCount);
  };

  onCommitEmitterHeight = emitterHeight => {
    this.props.editor.setNodeProperty(this.props.node, "emitterHeight", emitterHeight);
    this.props.node.createParticle();
  };

  onChangeEmitterHeight = emitterHeight => {
    this.props.editor.setNodeProperty(this.props.node, "emitterHeight", emitterHeight);
  };

  onCommitEmitterWidth = emitterWidth => {
    this.props.editor.setNodeProperty(this.props.node, "emitterWidth", emitterWidth);
    this.props.node.createParticle();
  };

  onChangeEmitterWidth = emitterWidth => {
    this.props.editor.setNodeProperty(this.props.node, "emitterWidth", emitterWidth);
  };

  onChangeLifetime = lifetime => {
    this.props.editor.setNodeProperty(this.props.node, "lifetime", lifetime);
  };

  onCommitLifetime = lifetime => {
    this.props.editor.setNodeProperty(this.props.node, "lifetime", lifetime);
    this.props.node.createParticle();
  };

  onChangeLifetimeRandomness = lifetimeRandomness => {
    this.props.editor.setNodeProperty(this.props.node, "lifetimeRandomness", lifetimeRandomness);
  };

  onCommitLifetimeRandomness = lifetimeRandomness => {
    this.props.editor.setNodeProperty(this.props.node, "lifetimeRandomness", lifetimeRandomness);
    this.props.node.createParticle();
  };

  render() {
    //console.log(this.props.node);
    return (
      <NodeEditor {...this.props} description={ParticleNodeEditor.description}>
        <InputGroup name="Image">
          <ImageInput value={this.props.node.src} onChange={this.onChangeSrc} />
        </InputGroup>
        <InputGroup name=" Curve">
          <SelectInput options={CurveOptions} value={this.props.node.curve} onChange={this.onChangeCurve} />
        </InputGroup>
        <InputGroup name="Start Color">
          <ColorInput value={this.props.node.startColor} onChange={this.onChangeStartColor} />
        </InputGroup>
        <InputGroup name="Start Opacity">
          <CompoundNumericInput
            min={0}
            max={1}
            step={0.01}
            precision={0.01}
            value={this.props.node.startOpacity}
            onChange={this.onChangeStartaOpacity}
          />
        </InputGroup>
        <InputGroup name="End Color">
          <ColorInput value={this.props.node.endColor} onChange={this.onChangeEndColor} />
        </InputGroup>
        <InputGroup name="End Opacity">
          <CompoundNumericInput
            min={0}
            max={1}
            step={0.01}
            precision={0.01}
            value={this.props.node.endOpacity}
            onChange={this.onChangeEndOpacity}
          />
        </InputGroup>

        <NumericInputGroup
          name="Particle Count"
          min={1}
          smallStep={1}
          mediumStep={1}
          largeStep={1}
          value={this.props.node.particleCount}
          onChange={this.onChangeParticleCount}
          onCommit={this.onCommitParticleCount}
          unit=""
        />
        <NumericInputGroup
          name="Emitter Height"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.emitterHeight}
          onChange={this.onChangeEmitterHeight}
          onCommit={this.onCommitEmitterHeight}
          unit=""
        />
        <NumericInputGroup
          name="Emitter Width"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.emitterWidth}
          onChange={this.onChangeEmitterWidth}
          onCommit={this.onCommitEmitterWidth}
          unit=""
        />
        <NumericInputGroup
          name="Size"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.size}
          onChange={this.onChangeSize}
          unit=""
        />
        <InputGroup name="Velocity">
          <Vector3Input
            value={this.props.node.velocity}
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={1}
            onChange={this.onChangeVelocity}
          />
        </InputGroup>
        <NumericInputGroup
          name="Lifetime"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.lifetime}
          onChange={this.onChangeLifetime}
          onCommit={this.onCommitLifetime}
          unit=""
        />

        <NumericInputGroup
          name="Lifetime Randomness"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.lifetimeRandomness}
          onChange={this.onChangeLifetimeRandomness}
          onCommit={this.onCommitLifetimeRandomness}
          unit=""
        />
      </NodeEditor>
    );
  }
}
