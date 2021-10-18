import React from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import { AudioType, AudioTypeOptions, DistanceModelOptions, DistanceModelType } from "../../editor/objects/AudioParams";
import useAudioParams from "./useAudioParams";
import useSetPropertySelected from "./useSetPropertySelected";
import BooleanInput from "../inputs/BooleanInput";

export default function AudioParamsProperties({ node, editor, multiEdit, sourceType }) {
  const onChangeOverrideAudioSettings = useSetPropertySelected(editor, "overrideAudioSettings");
  const paramProps = {
    audioType: useAudioParams(node, editor, sourceType, "audioType"),
    gain: useAudioParams(node, editor, sourceType, "gain"),
    distanceModel: useAudioParams(node, editor, sourceType, "distanceModel"),
    rolloffFactor: useAudioParams(node, editor, sourceType, "rolloffFactor"),
    refDistance: useAudioParams(node, editor, sourceType, "refDistance"),
    maxDistance: useAudioParams(node, editor, sourceType, "maxDistance"),
    coneInnerAngle: useAudioParams(node, editor, sourceType, "coneInnerAngle"),
    coneOuterAngle: useAudioParams(node, editor, sourceType, "coneOuterAngle"),
    coneOuterGain: useAudioParams(node, editor, sourceType, "coneOuterGain")
  };

  // TODO: Make node audio settings work with multi-edit

  return (
    <>
      <InputGroup name="Override Audio Settings">
        <BooleanInput value={node.overrideAudioSettings} onChange={onChangeOverrideAudioSettings} />
      </InputGroup>
      {node.overrideAudioSettings && (
        <>
          <InputGroup name="Audio Type" optional {...paramProps.audioType}>
            <SelectInput options={AudioTypeOptions} value={node.audioType} onChange={paramProps.audioType.onChange} />
          </InputGroup>
          <InputGroup name="Volume" optional {...paramProps.gain}>
            <CompoundNumericInput value={node.gain} onChange={paramProps.gain.onChange} />
          </InputGroup>
          {!multiEdit && node.audioType === AudioType.PannerNode && (
            <>
              <InputGroup
                name="Distance Model"
                info="The algorithim used to calculate audio rolloff."
                optional
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
                  optional
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
                  optional
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
                unit="m"
                optional
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
                unit="m"
                optional
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
                unit="°"
                disabled={multiEdit}
                optional
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
                unit="°"
                disabled={multiEdit}
                optional
                onChange={paramProps.coneOuterAngle.onChange}
                {...paramProps.coneOuterAngle}
              />
              <InputGroup
                name="Cone Outer Gain"
                info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard."
                optional
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
