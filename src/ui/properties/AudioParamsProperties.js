import React from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import {
  AudioType,
  AudioTypeOptions,
  DistanceModelOptions,
  DistanceModelType,
  SourceType
} from "../../editor/objects/AudioParams";
import { useAudioParamsPropertySelected } from "./useAudioParamsPropertySelected";
import useSetPropertySelected from "./useSetPropertySelected";
import BooleanInput from "../inputs/BooleanInput";
import { useIsAudioPropertyDefault } from "./useIsAudioPropertyDefault";

export default function AudioParamsProperties({ node, editor, multiEdit, sourceType }) {
  const onChangeOverrideAudioSettings = useSetPropertySelected(editor, "overrideAudioSettings");
  const [onChangeAudioType, onEnableAudioType, onResetAudioType] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "audioType"
  );
  const [onChangeGain, onEnableGain, onResetGain] = useAudioParamsPropertySelected(editor, sourceType, "gain");
  const [onChangeDistanceModel, onEnableDistanceModel, onResetDistanceModel] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "distanceModel"
  );
  const [onChangeRolloffFactor, onEnableRolloffFactor, onResetRolloffFactor] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "rolloffFactor"
  );
  const [onChangeRefDistance, onEnableRefDistance, onResetRefDistance] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "refDistance"
  );
  const [onChangeMaxDistance, onEnableMaxDistance, onResetMaxDistance] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "maxDistance"
  );
  const [onChangeConeInnerAngle, onEnableConeInnerAngle, onResetConeInnerAngle] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "coneInnerAngle"
  );
  const [onChangeConeOuterAngle, onEnableConeOuterAngle, onResetConeOuterAngle] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "coneOuterAngle"
  );
  const [onChangeConeOuterGain, onEnableConeOuterGain, onResetConeOuterGain] = useAudioParamsPropertySelected(
    editor,
    sourceType,
    "coneOuterGain"
  );

  const isAudioPropertyDefault = useIsAudioPropertyDefault(node);

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
            onReset={onResetAudioType}
            onResetEnabled={isAudioPropertyDefault("audioType", SourceType.MEDIA_VIDEO)}
          >
            <SelectInput options={AudioTypeOptions} value={node.audioType} onChange={onChangeAudioType} />
          </InputGroup>
          <InputGroup
            name="Volume"
            optional
            enabled={node.enabledProperties["gain"]}
            onEnable={onEnableGain}
            onReset={onResetGain}
            onResetEnabled={isAudioPropertyDefault("gain", SourceType.MEDIA_VIDEO)}
          >
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
                onReset={onResetDistanceModel}
                onResetEnabled={isAudioPropertyDefault("distanceModel", SourceType.MEDIA_VIDEO)}
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
                  onReset={onResetRolloffFactor}
                  onResetEnabled={isAudioPropertyDefault("rolloffFactor", SourceType.MEDIA_VIDEO)}
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
                  onReset={onResetRolloffFactor}
                  onResetEnabled={isAudioPropertyDefault("rolloffFactor", SourceType.MEDIA_VIDEO)}
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
                onReset={onResetRefDistance}
                onResetEnabled={isAudioPropertyDefault("refDistance", SourceType.MEDIA_VIDEO)}
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
                onReset={onResetMaxDistance}
                onResetEnabled={isAudioPropertyDefault("maxDistance", SourceType.MEDIA_VIDEO)}
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
                onReset={onResetConeInnerAngle}
                onResetEnabled={isAudioPropertyDefault("coneInnerAngle", SourceType.MEDIA_VIDEO)}
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
                onReset={onResetConeOuterAngle}
                onResetEnabled={isAudioPropertyDefault("coneOuterAngle", SourceType.MEDIA_VIDEO)}
              />
              <InputGroup
                name="Cone Outer Gain"
                info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard."
                optional
                enabled={node.enabledProperties["coneOuterGain"]}
                onEnable={onEnableConeOuterGain}
                onReset={onResetConeOuterGain}
                onResetEnabled={isAudioPropertyDefault("coneOuterGain", SourceType.MEDIA_VIDEO)}
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
  multiEdit: PropTypes.bool,
  sourceType: PropTypes.number
};
