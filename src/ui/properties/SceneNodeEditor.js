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
import { DistanceModelOptions, DistanceModelType } from "../../editor/objects/AudioParams";
import useEnablePropertySelected from "./useEnablePropertySelected";

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
  const [onChangeMediaVolume, onEnableMediaVolume] = useEnablePropertySelected(editor, "mediaVolume");
  const [onChangeMediaDistanceModel, onEnableMediaDistanceModel] = useEnablePropertySelected(
    editor,
    "mediaDistanceModel"
  );
  const [onChangeMediaRolloffFactor, onEnableMediaRolloffFactor] = useEnablePropertySelected(
    editor,
    "mediaRolloffFactor"
  );
  const [onChangeMediaRefDistance, onEnableMediaRefDistance] = useEnablePropertySelected(editor, "mediaRefDistance");
  const [onChangeMediaMaxDistance, onEnableMediaMaxDistance] = useEnablePropertySelected(editor, "mediaMaxDistance");
  const [onChangeMediaConeInnerAngle, onEnableMediaConeInnerAngle] = useEnablePropertySelected(
    editor,
    "mediaConeInnerAngle"
  );
  const [onChangeMediaConeOuterAngle, onEnableMediaConeOuterAngle] = useEnablePropertySelected(
    editor,
    "mediaConeOuterAngle"
  );
  const [onChangeMediaConeOuterGain, onEnableMediaConeOuterGain] = useEnablePropertySelected(
    editor,
    "mediaConeOuterGain"
  );
  const [onChangeAvatarDistanceModel, onEnableAvatarDistanceModel] = useEnablePropertySelected(
    editor,
    "avatarDistanceModel"
  );
  const [onChangeAvatarRolloffFactor, onEnableAvatarRolloffFactor] = useEnablePropertySelected(
    editor,
    "avatarRolloffFactor"
  );
  const [onChangeAvatarRefDistance, onEnableAvatarRefDistance] = useEnablePropertySelected(editor, "avatarRefDistance");
  const [onChangeAvatarMaxDistance, onEnableAvatarMaxDistance] = useEnablePropertySelected(editor, "avatarMaxDistance");

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
          />
          <InputGroup
            name="Media Volume"
            optional
            enabled={node.enabledProperties["mediaVolume"]}
            onEnable={onEnableMediaVolume}
          >
            <CompoundNumericInput value={node.mediaVolume} onChange={onChangeMediaVolume} />
          </InputGroup>
          <InputGroup
            name="Media Distance Model"
            info="The algorithim used to calculate audio rolloff."
            optional
            enabled={node.enabledProperties["mediaDistanceModel"]}
            onEnable={onEnableMediaDistanceModel}
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
          />
          <InputGroup
            name="Media Cone Outer Gain"
            info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard."
            optional
            enabled={node.enabledProperties["mediaConeOuterGain"]}
            onEnable={onEnableMediaConeOuterGain}
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
