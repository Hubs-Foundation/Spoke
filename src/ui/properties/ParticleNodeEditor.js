import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";
import ImageInput from "../inputs/ImageInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import BooleanInput from "../inputs/BooleanInput";

export default class ParticleNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-spray-can";

  static description = "Particles with maximum number 1000.";

  onChangeColor = color => {
    this.props.editor.setNodeProperty(this.props.node, "color", color);
  };

  onChangeSrc = src => {
    this.props.editor.setNodeProperty(this.props.node, "src", src);
  };

  onChangeRange = range => {
    this.props.editor.setNodeProperty(this.props.node, "range", range);
  };

  onCommitRange = range => {
    this.props.editor.setNodeProperty(this.props.node, "range", range);
    this.props.node.rebuildGeometry();
  };

  onChangeSize = size => {
    this.props.editor.setNodeProperty(this.props.node, "size", size);
  };

  onChangeIdle = idle => {
    this.props.editor.setNodeProperty(this.props.node, "idle", idle);
  };

  onChangeSpeed = speed => {
    this.props.editor.setNodeProperty(this.props.node, "speed", speed);
  };

  onChangeScatter = scatter => {
    this.props.editor.setNodeProperty(this.props.node, "scatter", scatter);
  };

  onCommitScatter = scatter => {
    this.props.editor.setNodeProperty(this.props.node, "scatter", scatter);
    this.props.node.rebuildGeometry();
  };

  onCommitParticleCount = particleCount => {
    this.props.editor.setNodeProperty(this.props.node, "particleCount", particleCount);
    this.props.node.rebuildGeometry();
  };

  onChangeParticleCount = particleCount => {
    this.props.editor.setNodeProperty(this.props.node, "particleCount", particleCount);
  };

  onChangeLifeTime = lifeTime => {
    this.props.editor.setNodeProperty(this.props.node, "lifeTime", lifeTime);
  };

  render() {
    //console.log(this.props.node.particleCount, this.props.node.range, this.props.node.size, this.props.node.speed);
    return (
      <NodeEditor {...this.props} description={ParticleNodeEditor.description}>
        <InputGroup name="Image">
          <ImageInput value={this.props.node.src} onChange={this.onChangeSrc} />
        </InputGroup>
        <InputGroup name="Color">
          <ColorInput value={this.props.node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <InputGroup name="Idle">
          <BooleanInput value={this.props.node.idle} onChange={this.onChangeIdle} />
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
          name="Scatter"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.scatter}
          onChange={this.onChangeScatter}
          onCommit={this.onCommitScatter}
          unit=""
        />
        <NumericInputGroup
          name="Range"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.range}
          onChange={this.onChangeRange}
          onCommit={this.onCommitRange}
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
        <NumericInputGroup
          name="Speed"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.speed}
          onChange={this.onChangeSpeed}
          unit=""
        />
        <NumericInputGroup
          name="Lifetime"
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={this.props.node.lifeTime}
          onChange={this.onChangeLifeTime}
          unit=""
        />
      </NodeEditor>
    );
  }
}
