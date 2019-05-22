import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import { AudioType, DistanceModelType, VideoProjection } from "../../editor/objects/Video";
import VideoInput from "../inputs/VideoInput";

const videoProjectionOptions = Object.values(VideoProjection).map(v => ({ label: v, value: v }));

const audioTypeOptions = Object.values(AudioType).map(v => ({ label: v, value: v }));

const distanceModelOptions = Object.values(DistanceModelType).map(v => ({ label: v, value: v }));

export default class VideoNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-video";

  static description = "Dynamically loads a video.";

  constructor(props) {
    super(props);
    const createPropSetter = propName => value => this.props.editor.setNodeProperty(this.props.node, propName, value);
    this.onChangeSrc = createPropSetter("src");
    this.onChangeProjection = createPropSetter("projection");
    this.onChangeControls = createPropSetter("controls");
    this.onChangeAutoPlay = createPropSetter("autoPlay");
    this.onChangeLoop = createPropSetter("loop");
    this.onChangeAudioType = createPropSetter("audioType");
    this.onChangeVolume = createPropSetter("volume");
    this.onChangeDistanceModel = createPropSetter("distanceModel");
    this.onChangeRolloffFactor = createPropSetter("rolloffFactor");
    this.onChangeRefDistance = createPropSetter("refDistance");
    this.onChangeMaxDistance = createPropSetter("maxDistance");
    this.onChangeConeInnerAngle = createPropSetter("coneInnerAngle");
    this.onChangeConeOuterAngle = createPropSetter("coneOuterAngle");
    this.onChangeConeOuterGain = createPropSetter("coneOuterGain");
  }

  render() {
    const node = this.props.node;

    return (
      <NodeEditor description={VideoNodeEditor.description} {...this.props}>
        <InputGroup name="Video">
          <VideoInput value={node.src} onChange={this.onChangeSrc} />
        </InputGroup>
        <InputGroup name="Projection">
          <SelectInput options={videoProjectionOptions} value={node.projection} onChange={this.onChangeProjection} />
        </InputGroup>
        <InputGroup name="Controls">
          <BooleanInput value={node.controls} onChange={this.onChangeControls} />
        </InputGroup>
        <InputGroup name="Auto Play">
          <BooleanInput value={node.autoPlay} onChange={this.onChangeAutoPlay} />
        </InputGroup>
        <InputGroup name="Loop">
          <BooleanInput value={node.loop} onChange={this.onChangeLoop} />
        </InputGroup>
        <InputGroup name="Audio Type">
          <SelectInput options={audioTypeOptions} value={node.audioType} onChange={this.onChangeAudioType} />
        </InputGroup>
        <InputGroup name="Volume">
          <CompoundNumericInput value={node.volume} onChange={this.onChangeVolume} />
        </InputGroup>
        {node.audioType === AudioType.PannerNode && (
          <Fragment>
            <InputGroup name="Distance Model">
              <SelectInput
                options={distanceModelOptions}
                value={node.distanceModel}
                onChange={this.onChangeDistanceModel}
              />
            </InputGroup>

            {node.distanceModel === DistanceModelType.linear ? (
              <InputGroup name="Rolloff Factor">
                <CompoundNumericInput
                  min={0}
                  max={1}
                  smallStep={0.001}
                  mediumStep={0.01}
                  largeStep={0.1}
                  precision={0.001}
                  value={node.rolloffFactor}
                  onChange={this.onChangeRolloffFactor}
                />
              </InputGroup>
            ) : (
              <NumericInputGroup
                name="Rolloff Factor"
                min={0}
                smallStep={0.1}
                mediumStep={1}
                largeStep={10}
                precision={0.001}
                value={node.rolloffFactor}
                onChange={this.onChangeRolloffFactor}
              />
            )}
            <NumericInputGroup
              name="Ref Distance"
              min={0}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              value={node.refDistance}
              onChange={this.onChangeRefDistance}
              unit="m"
            />
            <NumericInputGroup
              name="Max Distance"
              min={0}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              value={node.maxDistance}
              onChange={this.onChangeMaxDistance}
              unit="m"
            />
            <NumericInputGroup
              name="Cone Inner Angle"
              min={0}
              max={360}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              value={node.coneInnerAngle}
              onChange={this.onChangeConeInnerAngle}
              unit="°"
            />
            <NumericInputGroup
              name="Cone Outer Angle"
              min={0}
              max={360}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              value={node.coneOuterAngle}
              onChange={this.onChangeConeOuterAngle}
              unit="°"
            />
            <InputGroup name="Cone Outer Gain">
              <CompoundNumericInput
                min={0}
                max={1}
                step={0.01}
                precision={0.01}
                value={node.coneOuterGain}
                onChange={this.onChangeConeOuterGain}
              />
            </InputGroup>
          </Fragment>
        )}
      </NodeEditor>
    );
  }
}
