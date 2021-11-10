import React from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import {
  AudioType,
  AudioTypeOptions,
  Defaults,
  DistanceModelOptions,
  DistanceModelType,
  SourceType
} from "../../editor/objects/AudioParams";
import useOptionalParam from "./useOptionalParam";
import useSetPropertySelected from "./useSetPropertySelected";
import BooleanInput from "../inputs/BooleanInput";

export default function AudioParamsProperties({ node, editor, multiEdit, sourceType }) {
  const onChangeOverrideAudioSettings = useSetPropertySelected(editor, "overrideAudioSettings");
  const isOptional = sourceType === SourceType.AUDIO_ZONE;
  const paramProps = {
    audioType: useOptionalParam(node, editor, "audio-params", "audioType", Defaults[sourceType]["audioType"]),
    gain: useOptionalParam(node, editor, "audio-params", "gain", Defaults[sourceType]["gain"]),
    distanceModel: useOptionalParam(
      node,
      editor,
      "audio-params",
      "distanceModel",
      Defaults[sourceType]["distanceModel"]
    ),
    rolloffFactor: useOptionalParam(
      node,
      editor,
      "audio-params",
      "rolloffFactor",
      Defaults[sourceType]["rolloffFactor"]
    ),
    refDistance: useOptionalParam(node, editor, "audio-params", "refDistance", Defaults[sourceType]["refDistance"]),
    maxDistance: useOptionalParam(node, editor, "audio-params", "maxDistance", Defaults[sourceType]["maxDistance"]),
    coneInnerAngle: useOptionalParam(
      node,
      editor,
      "audio-params",
      "coneInnerAngle",
      Defaults[sourceType]["coneInnerAngle"]
    ),
    coneOuterAngle: useOptionalParam(
      node,
      editor,
      "audio-params",
      "coneOuterAngle",
      Defaults[sourceType]["coneOuterAngle"]
    ),
    coneOuterGain: useOptionalParam(
      node,
      editor,
      "audio-params",
      "coneOuterGain",
      Defaults[sourceType]["coneOuterGain"]
    )
  };

  // TODO: Make node audio settings work with multi-edit

  return (
    <>
      <InputGroup name="Override Audio Settings">
        <BooleanInput value={node.overrideAudioSettings} onChange={onChangeOverrideAudioSettings} />
      </InputGroup>
      {node.overrideAudioSettings && (
        <>
          <InputGroup name="Audio Type" optional={isOptional} {...paramProps.audioType}>
            <SelectInput options={AudioTypeOptions} value={node.audioType} onChange={paramProps.audioType.onChange} />
          </InputGroup>
          <InputGroup name="Volume" optional={isOptional} {...paramProps.gain}>
            <CompoundNumericInput value={node.gain} onChange={paramProps.gain.onChange} />
          </InputGroup>
          {!multiEdit && node.audioType === AudioType.PannerNode && (
            <>
              <InputGroup
                name="Distance Model"
                info="The algorithim used to calculate audio rolloff."
                optional={isOptional}
                {...paramProps.distanceModel}
              >
                <SelectInput
                  options={DistanceModelOptions}
                  value={node.distanceModel}
                  onChange={paramProps.distanceModel.onChange}
                />
              </InputGroup>

              {node.distanceModel === DistanceModelType.linear ? (
                <InputGroup
                  name="Rolloff Factor"
                  info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
                  optional={isOptional}
                  {...paramProps.rolloffFactor}
                >
                  <CompoundNumericInput
                    min={0}
                    max={1}
                    smallStep={0.001}
                    mediumStep={0.01}
                    largeStep={0.1}
                    value={node.rolloffFactor}
                    onChange={paramProps.rolloffFactor.onChange}
                  />
                </InputGroup>
              ) : (
                <NumericInputGroup
                  name="Rolloff Factor"
                  info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
                  min={0}
                  smallStep={0.1}
                  mediumStep={1}
                  largeStep={10}
                  value={node.rolloffFactor}
                  optional={isOptional}
                  onChange={paramProps.rolloffFactor.onChange}
                  {...paramProps.rolloffFactor}
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
                optional={isOptional}
                unit="m"
                onChange={paramProps.refDistance.onChange}
                {...paramProps.refDistance}
              />
              <NumericInputGroup
                name="Max Distance"
                info="A double value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further."
                min={0.00001}
                smallStep={0.1}
                mediumStep={1}
                largeStep={10}
                value={node.maxDistance}
                optional={isOptional}
                unit="m"
                onChange={paramProps.maxDistance.onChange}
                {...paramProps.maxDistance}
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
                optional={isOptional}
                unit="°"
                disabled={multiEdit}
                onChange={paramProps.coneInnerAngle.onChange}
                {...paramProps.coneInnerAngle}
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
                optional={isOptional}
                unit="°"
                disabled={multiEdit}
                onChange={paramProps.coneOuterAngle.onChange}
                {...paramProps.coneOuterAngle}
              />
              <InputGroup
                name="Cone Outer Gain"
                info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard."
                optional={isOptional}
                {...paramProps.coneOuterGain}
              >
                <CompoundNumericInput
                  min={0}
                  max={1}
                  step={0.01}
                  value={node.coneOuterGain}
                  onChange={paramProps.coneOuterGain.onChange}
                />
              </InputGroup>
            </>
          )}
        </>
      )}
    </>
  );
}

AudioParamsProperties.propTypes = {
  node: PropTypes.object,
  editor: PropTypes.object,
  multiEdit: PropTypes.bool,
  sourceType: PropTypes.number
};
