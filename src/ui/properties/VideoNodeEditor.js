import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import SelectInput from "../inputs/SelectInput";
import NumericInput from "../inputs/NumericInput";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import { AudioType, DistanceModelType, VideoProjection } from "../../editor/objects/Video";

const videoProjectionOptions = Object.values(VideoProjection).map(v => ({ label: v, value: v }));

const audioTypeOptions = Object.values(AudioType).map(v => ({ label: v, value: v }));

const distanceModelOptions = Object.values(DistanceModelType).map(v => ({ label: v, value: v }));

export default class VideoNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-video";

  constructor(props) {
    super(props);
    const createPropSetter = propName => value => this.props.editor.setNodeProperty(this.props.node, propName, value);
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
      <NodeEditor description="Dynamically loads an video." {...this.props}>
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
            <InputGroup name="Rolloff Factor">
              {node.distanceModel === DistanceModelType.linear ? (
                <CompoundNumericInput
                  min={0}
                  max={1}
                  value={node.rolloffFactor}
                  onChange={this.onChangeRolloffFactor}
                />
              ) : (
                <NumericInput min={0} value={node.rolloffFactor} onChange={this.onChangeRolloffFactor} />
              )}
            </InputGroup>
            <InputGroup name="Ref Distance">
              <NumericInput min={0} value={node.refDistance} onChange={this.onChangeRefDistance} />
            </InputGroup>
            <InputGroup name="Max Distance">
              <NumericInput min={0} value={node.maxDistance} onChange={this.onChangeMaxDistance} />
            </InputGroup>
            <InputGroup name="Cone Inner Angle">
              <NumericInput
                min={0}
                max={360}
                smallStep={1}
                mediumStep={15}
                bigStep={30}
                value={node.coneInnerAngle}
                onChange={this.onChangeConeInnerAngle}
              />
            </InputGroup>
            <InputGroup name="Cone Outer Angle">
              <NumericInput
                min={0}
                max={360}
                smallStep={1}
                mediumStep={15}
                bigStep={30}
                value={node.coneOuterAngle}
                onChange={this.onChangeConeOuterAngle}
              />
            </InputGroup>
            <InputGroup name="Cone Outer Gain">
              <CompoundNumericInput min={0} max={1} value={node.coneOuterGain} onChange={this.onChangeConeOuterGain} />
            </InputGroup>
          </Fragment>
        )}
      </NodeEditor>
    );
  }
}
