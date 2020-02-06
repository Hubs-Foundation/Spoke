import React from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import { AudioType, DistanceModelType } from "../../editor/objects/AudioSource";
import useSetPropertySelected from "./useSetPropertySelected";

const audioTypeOptions = Object.values(AudioType).map(v => ({ label: v, value: v }));

const distanceModelOptions = Object.values(DistanceModelType).map(v => ({ label: v, value: v }));

export default function AudioSourceProperties({ node, editor, multiEdit }) {
  const onChangeControls = useSetPropertySelected(editor, "controls");
  const onChangeAutoPlay = useSetPropertySelected(editor, "autoPlay");
  const onChangeLoop = useSetPropertySelected(editor, "loop");
  const onChangeAudioType = useSetPropertySelected(editor, "audioType");
  const onChangeVolume = useSetPropertySelected(editor, "volume");
  const onChangeDistanceModel = useSetPropertySelected(editor, "distanceModel");
  const onChangeRolloffFactor = useSetPropertySelected(editor, "rolloffFactor");
  const onChangeRefDistance = useSetPropertySelected(editor, "refDistance");
  const onChangeMaxDistance = useSetPropertySelected(editor, "maxDistance");
  const onChangeConeInnerAngle = useSetPropertySelected(editor, "coneInnerAngle");
  const onChangeConeOuterAngle = useSetPropertySelected(editor, "coneOuterAngle");
  const onChangeConeOuterGain = useSetPropertySelected(editor, "coneOuterGain");

  // TODO: Make node audio settings work with multi-edit

  return (
    <>
      <InputGroup name="Controls">
        <BooleanInput value={node.controls} onChange={onChangeControls} />
      </InputGroup>
      <InputGroup name="Auto Play">
        <BooleanInput value={node.autoPlay} onChange={onChangeAutoPlay} />
      </InputGroup>
      <InputGroup name="Loop">
        <BooleanInput value={node.loop} onChange={onChangeLoop} />
      </InputGroup>
      <InputGroup name="Audio Type">
        <SelectInput options={audioTypeOptions} value={node.audioType} onChange={onChangeAudioType} />
      </InputGroup>
      <InputGroup name="Volume">
        <CompoundNumericInput value={node.volume} onChange={onChangeVolume} />
      </InputGroup>
      {!multiEdit && node.audioType === AudioType.PannerNode && (
        <>
          <InputGroup name="Distance Model">
            <SelectInput options={distanceModelOptions} value={node.distanceModel} onChange={onChangeDistanceModel} />
          </InputGroup>

          {node.distanceModel === DistanceModelType.linear ? (
            <InputGroup name="Rolloff Factor">
              <CompoundNumericInput
                min={0}
                max={1}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                value={node.rolloffFactor}
                onChange={onChangeRolloffFactor}
              />
            </InputGroup>
          ) : (
            <NumericInputGroup
              name="Rolloff Factor"
              min={0}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              value={node.rolloffFactor}
              onChange={onChangeRolloffFactor}
            />
          )}
          <NumericInputGroup
            name="Ref Distance"
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.refDistance}
            onChange={onChangeRefDistance}
            unit="m"
          />
          <NumericInputGroup
            name="Max Distance"
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.maxDistance}
            onChange={onChangeMaxDistance}
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
            onChange={onChangeConeInnerAngle}
            unit="°"
            disabled={multiEdit}
          />
          <NumericInputGroup
            name="Cone Outer Angle"
            min={0}
            max={360}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.coneOuterAngle}
            onChange={onChangeConeOuterAngle}
            unit="°"
            disabled={multiEdit}
          />
          <InputGroup name="Cone Outer Gain">
            <CompoundNumericInput
              min={0}
              max={1}
              step={0.01}
              value={node.coneOuterGain}
              onChange={onChangeConeOuterGain}
            />
          </InputGroup>
        </>
      )}
    </>
  );
}

AudioSourceProperties.propTypes = {
  node: PropTypes.object,
  editor: PropTypes.object,
  multiEdit: PropTypes.bool
};
