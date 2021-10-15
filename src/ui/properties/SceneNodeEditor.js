import React from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Globe } from "styled-icons/fa-solid/Globe";
import NumericInputGroup from "../inputs/NumericInputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";
import { FogType } from "../../editor/nodes/SceneNode";
import SelectInput from "../inputs/SelectInput";
import useSetPropertySelected from "./useSetPropertySelected";
import BooleanInput from "../inputs/BooleanInput";
import { DistanceModelOptions, DistanceModelType, SourceType } from "../../editor/objects/AudioParams";
import { useSceneAudioParamsPropertySelected } from "./useAudioParamsPropertySelected";
import { useIsSceneAudioPropertyDefault } from "./useIsAudioPropertyDefault";

const FogTypeOptions = [
  {
    label: "Disabled",
    value: FogType.Disabled
  },
  {
    label: "Linear",
    value: FogType.Linear
  },
  {
    label: "Exponential",
    value: FogType.Exponential
  }
];

export default function SceneNodeEditor(props) {
  const { editor, node } = props;

  const onChangeBackground = useSetPropertySelected(editor, "background");
  const onChangeFogType = useSetPropertySelected(editor, "fogType");
  const onChangeFogColor = useSetPropertySelected(editor, "fogColor");
  const onChangeFogNearDistance = useSetPropertySelected(editor, "fogNearDistance");
  const onChangeFogFarDistance = useSetPropertySelected(editor, "fogFarDistance");
  const onChangeFogDensity = useSetPropertySelected(editor, "fogDensity");

  const onChangeOverrideAudioSettings = useSetPropertySelected(editor, "overrideAudioSettings");
  const [onChangeMediaVolume, onEnableMediaVolume, onResetMediaGain] = useSceneAudioParamsPropertySelected(
    editor,
    SourceType.MEDIA_VIDEO,
    "gain",
    "mediaVolume"
  );
  const [
    onChangeMediaDistanceModel,
    onEnableMediaDistanceModel,
    onResetMediaDistanceModel
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.MEDIA_VIDEO, "distanceModel", "mediaDistanceModel");
  const [
    onChangeMediaRolloffFactor,
    onEnableMediaRolloffFactor,
    onResetMediaRolloffFactor
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.MEDIA_VIDEO, "rolloffFactor", "mediaRolloffFactor");
  const [
    onChangeMediaRefDistance,
    onEnableMediaRefDistance,
    onResetMediaRefDistance
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.MEDIA_VIDEO, "refDistance", "mediaRefDistance");
  const [
    onChangeMediaMaxDistance,
    onEnableMediaMaxDistance,
    onResetMediaMaxDistance
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.MEDIA_VIDEO, "maxDistance", "mediaMaxDistance");
  const [
    onChangeMediaConeInnerAngle,
    onEnableMediaConeInnerAngle,
    onResetMediaConeInnerAngle
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.MEDIA_VIDEO, "coneInnerAngle", "mediaConeInnerAngle");
  const [
    onChangeMediaConeOuterAngle,
    onEnableMediaConeOuterAngle,
    onResetMediaConeOuterAngle
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.MEDIA_VIDEO, "coneOuterAngle", "mediaConeOuterAngle");
  const [
    onChangeMediaConeOuterGain,
    onEnableMediaConeOuterGain,
    onResetMediaConeOuterGain
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.MEDIA_VIDEO, "coneOuterGain", "mediaConeOuterGain");
  const [
    onChangeAvatarDistanceModel,
    onEnableAvatarDistanceModel,
    onResetAvatarDistanceModel
  ] = useSceneAudioParamsPropertySelected(
    editor,
    SourceType.AVATAR_AUDIO_SOURCE,
    "distanceModel",
    "avatarDistanceModel"
  );
  const [
    onChangeAvatarRolloffFactor,
    onEnableAvatarRolloffFactor,
    onResetAvatarRolloffFactor
  ] = useSceneAudioParamsPropertySelected(
    editor,
    SourceType.AVATAR_AUDIO_SOURCE,
    "rolloffFactor",
    "avatarRolloffFactor"
  );
  const [
    onChangeAvatarRefDistance,
    onEnableAvatarRefDistance,
    onResetAvatarRefDistance
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.AVATAR_AUDIO_SOURCE, "refDistance", "avatarRefDistance");
  const [
    onChangeAvatarMaxDistance,
    onEnableAvatarMaxDistance,
    onResetAvatarMaxDistance
  ] = useSceneAudioParamsPropertySelected(editor, SourceType.AVATAR_AUDIO_SOURCE, "maxDistance", "avatarMaxDistance");

  const isAudioPropertyDefault = useIsSceneAudioPropertyDefault(node);

  return (
    <NodeEditor {...props} description={SceneNodeEditor.description}>
      <InputGroup name="Background Color">
        <ColorInput value={node.background} onChange={onChangeBackground} />
      </InputGroup>
      <InputGroup name="Fog Type">
        <SelectInput options={FogTypeOptions} value={node.fogType} onChange={onChangeFogType} />
      </InputGroup>
      {node.fogType !== FogType.Disabled && (
        <InputGroup name="Fog Color">
          <ColorInput value={node.fogColor} onChange={onChangeFogColor} />
        </InputGroup>
      )}
      {node.fogType === FogType.Linear && (
        <>
          <NumericInputGroup
            name="Fog Near Distance"
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            min={0}
            value={node.fogNearDistance}
            onChange={onChangeFogNearDistance}
          />
          <NumericInputGroup
            name="Fog Far Distance"
            smallStep={1}
            mediumStep={100}
            largeStep={1000}
            min={0}
            value={node.fogFarDistance}
            onChange={onChangeFogFarDistance}
          />
        </>
      )}
      {node.fogType === FogType.Exponential && (
        <NumericInputGroup
          name="Fog Density"
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          min={0}
          value={node.fogDensity}
          onChange={onChangeFogDensity}
        />
      )}
      <InputGroup name="Override Audio Settings">
        <BooleanInput value={node.overrideAudioSettings} onChange={onChangeOverrideAudioSettings} />
      </InputGroup>
      {node.overrideAudioSettings && (
        <>
          <InputGroup
            name="Avatar Distance Model"
            info="The algorithim used to calculate audio rolloff."
            optional
            enabled={node.enabledProperties["avatarDistanceModel"]}
            onEnable={onEnableAvatarDistanceModel}
            onReset={onResetAvatarDistanceModel}
            onResetEnabled={isAudioPropertyDefault(
              "distanceModel",
              "avatarDistanceModel",
              SourceType.AVATAR_AUDIO_SOURCE
            )}
          >
            <SelectInput
              options={DistanceModelOptions}
              value={node.avatarDistanceModel}
              onChange={onChangeAvatarDistanceModel}
            />
          </InputGroup>

          {node.avatarDistanceModel === DistanceModelType.linear ? (
            <InputGroup
              name="Avatar Rolloff Factor"
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
              optional
              enabled={node.enabledProperties["avatarRolloffFactor"]}
              onEnable={onEnableAvatarRolloffFactor}
              onReset={onResetAvatarRolloffFactor}
              onResetEnabled={isAudioPropertyDefault(
                "rolloffFactor",
                "avatarRolloffFactor",
                SourceType.AVATAR_AUDIO_SOURCE
              )}
            >
              <CompoundNumericInput
                min={0}
                max={1}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                value={node.avatarRolloffFactor}
                onChange={onChangeAvatarRolloffFactor}
              />
            </InputGroup>
          ) : (
            <NumericInputGroup
              name="Avatar Rolloff Factor"
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to Infinity"
              min={0}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              value={node.avatarRolloffFactor}
              onChange={onChangeAvatarRolloffFactor}
              optional
              enabled={node.enabledProperties["avatarRolloffFactor"]}
              onEnable={onEnableAvatarRolloffFactor}
              onReset={onResetAvatarRolloffFactor}
              onResetEnabled={isAudioPropertyDefault(
                "rolloffFactor",
                "avatarRolloffFactor",
                SourceType.AVATAR_AUDIO_SOURCE
              )}
            />
          )}
          <NumericInputGroup
            name="Avatar Ref Distance"
            info="A double value representing the reference distance for reducing volume as the audio source moves further from the listener."
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.avatarRefDistance}
            onChange={onChangeAvatarRefDistance}
            unit="m"
            optional
            enabled={node.enabledProperties["avatarRefDistance"]}
            onEnable={onEnableAvatarRefDistance}
            onReset={onResetAvatarRefDistance}
            onResetEnabled={isAudioPropertyDefault("refDistance", "avatarRefDistance", SourceType.AVATAR_AUDIO_SOURCE)}
          />
          <NumericInputGroup
            name="Avatar Max Distance"
            info="A double value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further."
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.avatarMaxDistance}
            onChange={onChangeAvatarMaxDistance}
            unit="m"
            optional
            enabled={node.enabledProperties["avatarMaxDistance"]}
            onEnable={onEnableAvatarMaxDistance}
            onReset={onResetAvatarMaxDistance}
            onResetEnabled={isAudioPropertyDefault("maxDistance", "avatarMaxDistance", SourceType.AVATAR_AUDIO_SOURCE)}
          />
          <InputGroup
            name="Media Volume"
            optional
            enabled={node.enabledProperties["mediaVolume"]}
            onEnable={onEnableMediaVolume}
            onReset={onResetMediaGain}
            onResetEnabled={isAudioPropertyDefault("gain", "mediaVolume", SourceType.MEDIA_VIDEO)}
          >
            <CompoundNumericInput value={node.mediaVolume} onChange={onChangeMediaVolume} />
          </InputGroup>
          <InputGroup
            name="Media Distance Model"
            info="The algorithim used to calculate audio rolloff."
            optional
            enabled={node.enabledProperties["mediaDistanceModel"]}
            onEnable={onEnableMediaDistanceModel}
            onReset={onResetMediaDistanceModel}
            onResetEnabled={isAudioPropertyDefault("distanceModel", "mediaDistanceModel", SourceType.MEDIA_VIDEO)}
          >
            <SelectInput
              options={DistanceModelOptions}
              value={node.mediaDistanceModel}
              onChange={onChangeMediaDistanceModel}
            />
          </InputGroup>

          {node.mediaDistanceModel === DistanceModelType.linear ? (
            <InputGroup
              name="Media Rolloff Factor"
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
              optional
              enabled={node.enabledProperties["mediaRolloffFactor"]}
              onEnable={onEnableMediaRolloffFactor}
              onReset={onResetMediaRolloffFactor}
              onResetEnabled={isAudioPropertyDefault("rolloffFactor", "mediaRolloffFactor", SourceType.MEDIA_VIDEO)}
            >
              <CompoundNumericInput
                min={0}
                max={1}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                value={node.mediaRolloffFactor}
                onChange={onChangeMediaRolloffFactor}
              />
            </InputGroup>
          ) : (
            <NumericInputGroup
              name="Media Rolloff Factor"
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to Infinity"
              min={0}
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              value={node.mediaRolloffFactor}
              onChange={onChangeMediaRolloffFactor}
              optional
              enabled={node.enabledProperties["mediaRolloffFactor"]}
              onEnable={onEnableMediaRolloffFactor}
              onReset={onResetMediaRolloffFactor}
              onResetEnabled={isAudioPropertyDefault("rolloffFactor", "mediaRolloffFactor", SourceType.MEDIA_VIDEO)}
            />
          )}
          <NumericInputGroup
            name="Media Ref Distance"
            info="A double value representing the reference distance for reducing volume as the audio source moves further from the listener."
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.mediaRefDistance}
            onChange={onChangeMediaRefDistance}
            unit="m"
            optional
            enabled={node.enabledProperties["mediaRefDistance"]}
            onEnable={onEnableMediaRefDistance}
            onReset={onResetMediaRefDistance}
            onResetEnabled={isAudioPropertyDefault("refDistance", "mediaRefDistance", SourceType.MEDIA_VIDEO)}
          />
          <NumericInputGroup
            name="Media Max Distance"
            info="A double value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further."
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.mediaMaxDistance}
            onChange={onChangeMediaMaxDistance}
            unit="m"
            optional
            enabled={node.enabledProperties["mediaMaxDistance"]}
            onEnable={onEnableMediaMaxDistance}
            onReset={onResetMediaMaxDistance}
            onResetEnabled={isAudioPropertyDefault("maxDistance", "mediaMaxDistance", SourceType.MEDIA_VIDEO)}
          />
          <NumericInputGroup
            name="Media Cone Inner Angle"
            info="A double value describing the angle, in degrees, of a cone inside of which there will be no volume reduction."
            min={0}
            max={360}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.mediaConeInnerAngle}
            onChange={onChangeMediaConeInnerAngle}
            unit="°"
            optional
            enabled={node.enabledProperties["mediaConeInnerAngle"]}
            onEnable={onEnableMediaConeInnerAngle}
            onReset={onResetMediaConeInnerAngle}
            onResetEnabled={isAudioPropertyDefault("coneInnerAngle", "mediaConeInnerAngle", SourceType.MEDIA_VIDEO)}
          />
          <NumericInputGroup
            name="Media Cone Outer Angle"
            info="A double value describing the angle, in degrees, of a cone outside of which the volume will be reduced by a constant value, defined by the coneOuterGain attribute."
            min={0}
            max={360}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.mediaConeOuterAngle}
            onChange={onChangeMediaConeOuterAngle}
            unit="°"
            optional
            enabled={node.enabledProperties["mediaConeOuterAngle"]}
            onEnable={onEnableMediaConeOuterAngle}
            onReset={onResetMediaConeOuterAngle}
            onResetEnabled={isAudioPropertyDefault("coneOuterAngle", "mediaConeOuterAngle", SourceType.MEDIA_VIDEO)}
          />
          <InputGroup
            name="Media Cone Outer Gain"
            info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard."
            optional
            enabled={node.enabledProperties["mediaConeOuterGain"]}
            onEnable={onEnableMediaConeOuterGain}
            onReset={onResetMediaConeOuterGain}
            onResetEnabled={isAudioPropertyDefault("coneOuterGain", "mediaConeOuterGain", SourceType.MEDIA_VIDEO)}
          >
            <CompoundNumericInput
              min={0}
              max={1}
              step={0.01}
              value={node.mediaConeOuterGain}
              onChange={onChangeMediaConeOuterGain}
            />
          </InputGroup>
        </>
      )}
    </NodeEditor>
  );
}

SceneNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object
};

SceneNodeEditor.iconComponent = Globe;

SceneNodeEditor.description = "The root object of the scene.";
