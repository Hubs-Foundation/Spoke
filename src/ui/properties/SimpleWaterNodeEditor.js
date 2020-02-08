import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Water } from "styled-icons/fa-solid/Water";
import NumericInputGroup from "../inputs/NumericInputGroup";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";
import Vector2Input from "../inputs/Vector2Input";

export default class SimpleWaterNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Water;

  static description = "Renders a water plane.";

  onChangeColor = color => {
    this.props.editor.setPropertySelected("color", color);
  };

  onChangeOpacity = opacity => {
    this.props.editor.setPropertySelected("opacity", opacity);
  };

  onChangeTideHeight = tideHeight => {
    this.props.editor.setPropertySelected("tideHeight", tideHeight);
  };

  onChangeTideScale = tideScale => {
    this.props.editor.setPropertySelected("tideScale", tideScale);
  };

  onChangeTideSpeed = tideSpeed => {
    this.props.editor.setPropertySelected("tideSpeed", tideSpeed);
  };

  onChangeWaveHeight = waveHeight => {
    this.props.editor.setPropertySelected("waveHeight", waveHeight);
  };

  onChangeWaveScale = waveScale => {
    this.props.editor.setPropertySelected("waveScale", waveScale);
  };

  onChangeWaveSpeed = waveSpeed => {
    this.props.editor.setPropertySelected("waveSpeed", waveSpeed);
  };

  onChangeRipplesScale = ripplesScale => {
    this.props.editor.setPropertySelected("ripplesScale", ripplesScale);
  };

  onChangeRipplesSpeed = ripplesSpeed => {
    this.props.editor.setPropertySelected("ripplesSpeed", ripplesSpeed);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={SimpleWaterNodeEditor.description}>
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <NumericInputGroup
          name="Opacity"
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          min={0}
          max={1}
          value={node.opacity}
          onChange={this.onChangeOpacity}
        />
        <NumericInputGroup
          name="Tide Height"
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          min={0}
          value={node.tideHeight}
          onChange={this.onChangeTideHeight}
        />
        <InputGroup name="Tide Scale">
          <Vector2Input
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={0.25}
            value={node.tideScale}
            onChange={this.onChangeTideScale}
          />
        </InputGroup>
        <InputGroup name="Tide Speed">
          <Vector2Input
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={0.25}
            value={node.tideSpeed}
            onChange={this.onChangeTideSpeed}
          />
        </InputGroup>
        <NumericInputGroup
          name="Wave Height"
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          min={0}
          value={node.waveHeight}
          onChange={this.onChangeWaveHeight}
        />
        <InputGroup name="Wave Scale">
          <Vector2Input
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={0.25}
            value={node.waveScale}
            onChange={this.onChangeWaveScale}
          />
        </InputGroup>
        <InputGroup name="Wave Speed">
          <Vector2Input
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={0.25}
            value={node.waveSpeed}
            onChange={this.onChangeWaveSpeed}
          />
        </InputGroup>
        <NumericInputGroup
          name="Ripples Speed"
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          value={node.ripplesSpeed}
          onChange={this.onChangeRipplesSpeed}
        />
        <NumericInputGroup
          name="Ripples Scale"
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          value={node.ripplesScale}
          onChange={this.onChangeRipplesScale}
        />
      </NodeEditor>
    );
  }
}
