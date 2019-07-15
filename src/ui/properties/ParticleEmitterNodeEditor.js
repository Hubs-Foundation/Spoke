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

const ColorCurveOptions = [
  {
    label: "Even",
    value: "Even"
  },
  {
    label: "Ease-in",
    value: "EaseIn"
  },
  {
    label: "Ease-out",
    value: "EaseOut"
  },
  {
    label: "Ease-in,out",
    value: "EaseInOut"
  }
];

const VelocityCurveOptions = [
  {
    label: "Linear",
    value: "Linear"
  },
  {
    label: "Ease-in",
    value: "EaseIn"
  },
  {
    label: "Ease-out",
    value: "EaseOut"
  },
  {
    label: "Ease-in,out",
    value: "EaseInOut"
  }
];

export default class ParticleEmitterNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-spray-can";

  static description = "Particle emitter to create particles.";

  onChangeColorCurve = colorCurve => {
    this.props.editor.setNodeProperty(this.props.node, "colorCurve", colorCurve);
  };

  onChangeVelocityCurve = velocityCurve => {
    this.props.editor.setNodeProperty(this.props.node, "velocityCurve", velocityCurve);
  };

  onChangeStartColor = startColor => {
    this.props.editor.setNodeProperty(this.props.node, "startColor", startColor);
  };

  onChangeMiddleColor = middleColor => {
    this.props.editor.setNodeProperty(this.props.node, "middleColor", middleColor);
  };

  onChangeEndColor = endColor => {
    this.props.editor.setNodeProperty(this.props.node, "endColor", endColor);
  };

  onChangeStartOpacity = startOpacity => {
    this.props.editor.setNodeProperty(this.props.node, "startOpacity", startOpacity);
  };

  onChangeMiddleOpacity = middleOpacity => {
    this.props.editor.setNodeProperty(this.props.node, "middleOpacity", middleOpacity);
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

  onChangeEndVelocity = endVelocity => {
    this.props.editor.setNodeProperty(this.props.node, "endVelocity", endVelocity);
  };

  onChangeAngularVelocity = angularVelocity => {
    this.props.editor.setNodeProperty(this.props.node, "angularVelocity", angularVelocity);
  };

  onCommitAngularVelocity = angularVelocity => {
    this.props.editor.setNodeProperty(this.props.node, "angularVelocity", angularVelocity);
    this.props.node.createParticle();
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

  onChangeAgeRandomness = ageRandomness => {
    this.props.editor.setNodeProperty(this.props.node, "ageRandomness", ageRandomness);
  };

  onCommitAgeRandomness = ageRandomness => {
    this.props.editor.setNodeProperty(this.props.node, "ageRandomness", ageRandomness);
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
    return (
      <NodeEditor {...this.props} description={ParticleEmitterNodeEditor.description}>
        <InputGroup name="Image">
          <ImageInput value={this.props.node.src} onChange={this.onChangeSrc} />
        </InputGroup>

        <InputGroup name="Color Curve">
          <SelectInput
            options={ColorCurveOptions}
            value={this.props.node.colorCurve}
            onChange={this.onChangeColorCurve}
          />
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
            onChange={this.onChangeStartOpacity}
          />
        </InputGroup>

        <InputGroup name="Middle Color">
          <ColorInput value={this.props.node.middleColor} onChange={this.onChangeMiddleColor} />
        </InputGroup>

        <InputGroup name="Middle Opacity">
          <CompoundNumericInput
            min={0}
            max={1}
            step={0.01}
            precision={0.01}
            value={this.props.node.middleOpacity}
            onChange={this.onChangeMiddleOpacity}
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
        />
        <NumericInputGroup
          name="Size"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.size}
          onChange={this.onChangeSize}
        />

        <InputGroup name="Velocity Curve">
          <SelectInput
            options={VelocityCurveOptions}
            value={this.props.node.velocityCurve}
            onChange={this.onChangeVelocityCurve}
          />
        </InputGroup>

        <InputGroup name="Start Velocity">
          <Vector3Input
            value={this.props.node.velocity}
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={1}
            onChange={this.onChangeVelocity}
          />
        </InputGroup>

        <InputGroup name="End Velocity">
          <Vector3Input
            value={this.props.node.endVelocity}
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={1}
            onChange={this.onChangeEndVelocity}
          />
        </InputGroup>

        <NumericInputGroup
          name="Angular Velocity"
          min={-100}
          smallStep={1}
          mediumStep={1}
          largeStep={1}
          value={this.props.node.angularVelocity}
          onChange={this.onChangeAngularVelocity}
          onCommit={this.onCommitAngularVelocity}
        />

        <NumericInputGroup
          name="Age Randomness"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.ageRandomness}
          onChange={this.onChangeAgeRandomness}
          onCommit={this.onCommitAgeRandomness}
          unit=""
        />

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
