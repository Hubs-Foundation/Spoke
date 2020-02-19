import React from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import { AudioType, AudioTypeOptions, DistanceModelOptions, DistanceModelType } from "../../editor/objects/AudioSource";
import useSetPropertySelected from "./useSetPropertySelected";

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
      <InputGroup name="Controls" info="Toggle the visibility of the media controls in Hubs.">
        <BooleanInput value={node.controls} onChange={onChangeControls} />
      </InputGroup>
      <InputGroup name="Auto Play" info="If true, the media will play when first entering the scene.">
        <BooleanInput value={node.autoPlay} onChange={onChangeAutoPlay} />
      </InputGroup>
      <InputGroup name="Loop" info="If true the media will loop indefinitely.">
        <BooleanInput value={node.loop} onChange={onChangeLoop} />
      </InputGroup>
      <InputGroup name="Audio Type">
        <SelectInput options={AudioTypeOptions} value={node.audioType} onChange={onChangeAudioType} />
      </InputGroup>
      <InputGroup name="Volume">
        <CompoundNumericInput value={node.volume} onChange={onChangeVolume} />
      </InputGroup>
      {!multiEdit && node.audioType === AudioType.PannerNode && (
        <>
          <InputGroup name="Distance Model" info="The algorithim used to calculate audio rolloff.">
            <SelectInput options={DistanceModelOptions} value={node.distanceModel} onChange={onChangeDistanceModel} />
          </InputGroup>

          {node.distanceModel === DistanceModelType.linear ? (
            <InputGroup
              name="Rolloff Factor"
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
            >
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
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to Infinity"
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
            info="A double value representing the reference distance for reducing volume as the audio source moves further from the listener."
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
            info="A double value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further."
            min={0.00001}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.maxDistance}
            onChange={onChangeMaxDistance}
            unit="m"
          />
          <NumericInputGroup
            name="Cone Inner Angle"
            info="A double value describing the angle, in degrees, of a cone inside of which there will be no volume reduction."
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
            info="A double value describing the angle, in degrees, of a cone outside of which the volume will be reduced by a constant value, defined by the coneOuterGain attribute."
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
          <InputGroup
            name="Cone Outer Gain"
            info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard."
          >
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
