import React from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import { AudioType, AudioTypeOptions, DistanceModelOptions, DistanceModelType } from "../../editor/objects/AudioParams";
import useEnablePropertySelected from "./useEnablePropertySelected";
import useSetPropertySelected from "./useSetPropertySelected";
import BooleanInput from "../inputs/BooleanInput";

export default function AudioParamsProperties({ node, editor, multiEdit }) {
  const onChangeOverrideAudioSettings = useSetPropertySelected(editor, "overrideAudioSettings");
  const [onChangeAudioType, onEnableAudioType] = useEnablePropertySelected(editor, "audioType");
  const [onChangeGain, onEnableGain] = useEnablePropertySelected(editor, "gain");
  const [onChangeDistanceModel, onEnableDistanceModel] = useEnablePropertySelected(editor, "distanceModel");
  const [onChangeRolloffFactor, onEnableRolloffFactor] = useEnablePropertySelected(editor, "rolloffFactor");
  const [onChangeRefDistance, onEnableRefDistance] = useEnablePropertySelected(editor, "refDistance");
  const [onChangeMaxDistance, onEnableMaxDistance] = useEnablePropertySelected(editor, "maxDistance");
  const [onChangeConeInnerAngle, onEnableConeInnerAngle] = useEnablePropertySelected(editor, "coneInnerAngle");
  const [onChangeConeOuterAngle, onEnableConeOuterAngle] = useEnablePropertySelected(editor, "coneOuterAngle");
  const [onChangeConeOuterGain, onEnableConeOuterGain] = useEnablePropertySelected(editor, "coneOuterGain");

  // TODO: Make node audio settings work with multi-edit

  return (
    <>
      <InputGroup name="Override Audio Settings">
        <BooleanInput value={node.overrideAudioSettings} onChange={onChangeOverrideAudioSettings} />
      </InputGroup>
      {node.overrideAudioSettings && (
        <>
          <InputGroup
            name="Audio Type"
            optional
            enabled={node.enabledProperties["audioType"]}
            onEnable={onEnableAudioType}
          >
            <SelectInput options={AudioTypeOptions} value={node.audioType} onChange={onChangeAudioType} />
          </InputGroup>
          <InputGroup name="Volume" optional enabled={node.enabledProperties["gain"]} onEnable={onEnableGain}>
            <CompoundNumericInput value={node.gain} onChange={onChangeGain} />
          </InputGroup>
          {!multiEdit && node.audioType === AudioType.PannerNode && (
            <>
              <InputGroup
                name="Distance Model"
                info="The algorithim used to calculate audio rolloff."
                optional
                enabled={node.enabledProperties["distanceModel"]}
                onEnable={onEnableDistanceModel}
              >
                <SelectInput
                  options={DistanceModelOptions}
                  value={node.distanceModel}
                  onChange={onChangeDistanceModel}
                />
              </InputGroup>

              {node.distanceModel === DistanceModelType.linear ? (
                <InputGroup
                  name="Rolloff Factor"
                  info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
                  optional
                  enabled={node.enabledProperties["rolloffFactor"]}
                  onEnable={onEnableRolloffFactor}
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
                  info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
                  min={0}
                  smallStep={0.1}
                  mediumStep={1}
                  largeStep={10}
                  value={node.rolloffFactor}
                  onChange={onChangeRolloffFactor}
                  optional
                  enabled={node.enabledProperties["rolloffFactor"]}
                  onEnable={onEnableRolloffFactor}
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
                optional
                enabled={node.enabledProperties["refDistance"]}
                onEnable={onEnableRefDistance}
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
                optional
                enabled={node.enabledProperties["maxDistance"]}
                onEnable={onEnableMaxDistance}
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
                optional
                enabled={node.enabledProperties["coneInnerAngle"]}
                onEnable={onEnableConeInnerAngle}
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
                optional
                enabled={node.enabledProperties["coneOuterAngle"]}
                onEnable={onEnableConeOuterAngle}
              />
              <InputGroup
                name="Cone Outer Gain"
                info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard."
                optional
                enabled={node.enabledProperties["coneOuterGain"]}
                onEnable={onEnableConeOuterGain}
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
      )}
    </>
  );
}

AudioParamsProperties.propTypes = {
  node: PropTypes.object,
  editor: PropTypes.object,
  multiEdit: PropTypes.bool
};
