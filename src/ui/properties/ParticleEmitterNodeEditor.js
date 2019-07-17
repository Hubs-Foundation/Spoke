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
import { CurveOptions } from "../../editor/utils/Curves";

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

  onChangeSizeCurve = sizeCurve => {
    this.props.editor.setNodeProperty(this.props.node, "sizeCurve", sizeCurve);
  };

  onChangeStartSize = startSize => {
    this.props.editor.setNodeProperty(this.props.node, "startSize", startSize);
  };

  onChangeEndSize = endSize => {
    this.props.editor.setNodeProperty(this.props.node, "endSize", endSize);
  };

  onChangeSizeRandomness = sizeRandomness => {
    this.props.editor.setNodeProperty(this.props.node, "sizeRandomness", sizeRandomness);
  };

  onCommitSizeRandomness = sizeRandomness => {
    this.props.editor.setNodeProperty(this.props.node, "sizeRandomness", sizeRandomness);
    this.props.node.createParticle();
  };

  onChangeStartVelocity = startVelocity => {
    this.props.editor.setNodeProperty(this.props.node, "startVelocity", startVelocity);
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

  onChangeParticleCount = particleCount => {
    this.props.editor.setNodeProperty(this.props.node, "particleCount", particleCount);
    this.props.node.createParticle();
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
        <NumericInputGroup
          name="Emitter Width"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.emitterWidth}
          onChange={this.onChangeEmitterWidth}
          onCommit={this.onCommitEmitterWidth}
          unit="m"
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
          unit="m"
        />

        <NumericInputGroup
          name="Particle Count"
          min={1}
          smallStep={1}
          mediumStep={1}
          largeStep={1}
          value={this.props.node.particleCount}
          onChange={this.onChangeParticleCount}
        />

        <InputGroup name="Image">
          <ImageInput value={this.props.node.src} onChange={this.onChangeSrc} />
        </InputGroup>

        <NumericInputGroup
          name="Age Randomness"
          info="The amount of variation between when particles are spawned."
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.ageRandomness}
          onChange={this.onChangeAgeRandomness}
          onCommit={this.onCommitAgeRandomness}
          unit="s"
        />

        <NumericInputGroup
          name="Lifetime"
          info="The maximum age of a particle before it is respawned."
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.lifetime}
          onChange={this.onChangeLifetime}
          onCommit={this.onCommitLifetime}
          unit="s"
        />

        <NumericInputGroup
          name="Lifetime Randomness"
          info="The amount of variation between particle lifetimes."
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.lifetimeRandomness}
          onChange={this.onChangeLifetimeRandomness}
          onCommit={this.onCommitLifetimeRandomness}
          unit="s"
        />

        <InputGroup name="Size Curve">
          <SelectInput options={CurveOptions} value={this.props.node.sizeCurve} onChange={this.onChangeSizeCurve} />
        </InputGroup>

        <NumericInputGroup
          name="Start Particle Size"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.startSize}
          onChange={this.onChangeStartSize}
          unit="m"
        />

        <NumericInputGroup
          name="End Particle Size"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.endSize}
          onChange={this.onChangeEndSize}
          unit="m"
        />

        <NumericInputGroup
          name="Size Randomness"
          info="The amount of variation between particle starting sizes."
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.sizeRandomness}
          onChange={this.onChangeSizeRandomness}
          onCommit={this.onCommitSizeRandomness}
          unit="m"
        />

        <InputGroup name="Color Curve">
          <SelectInput options={CurveOptions} value={this.props.node.colorCurve} onChange={this.onChangeColorCurve} />
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

        <InputGroup name="Velocity Curve">
          <SelectInput
            options={CurveOptions}
            value={this.props.node.velocityCurve}
            onChange={this.onChangeVelocityCurve}
          />
        </InputGroup>

        <InputGroup name="Start Velocity">
          <Vector3Input
            value={this.props.node.startVelocity}
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={1}
            onChange={this.onChangeStartVelocity}
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
          unit="°/s"
        />
      </NodeEditor>
    );
  }
}
