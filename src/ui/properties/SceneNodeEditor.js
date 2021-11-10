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
import { Defaults, DistanceModelOptions, DistanceModelType, SourceType } from "../../editor/objects/AudioParams";
import useOptionalParam from "./useOptionalParam";

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
  const mediaParamProps = {
    gain: useOptionalParam(node, editor, "scene", "mediaVolume", Defaults[SourceType.MEDIA_VIDEO]["gain"]),
    distanceModel: useOptionalParam(
      node,
      editor,
      "scene",
      "mediaDistanceModel",
      Defaults[SourceType.MEDIA_VIDEO]["distanceModel"]
    ),
    rolloffFactor: useOptionalParam(
      node,
      editor,
      "scene",
      "mediaRolloffFactor",
      Defaults[SourceType.MEDIA_VIDEO]["rolloffFactor"]
    ),
    refDistance: useOptionalParam(
      node,
      editor,
      "scene",
      "mediaRefDistance",
      Defaults[SourceType.MEDIA_VIDEO]["refDistance"]
    ),
    maxDistance: useOptionalParam(
      node,
      editor,
      "scene",
      "mediaMaxDistance",
      Defaults[SourceType.MEDIA_VIDEO]["maxDistance"]
    ),
    coneInnerAngle: useOptionalParam(
      node,
      editor,
      "scene",
      "mediaConeInnerAngle",
      Defaults[SourceType.MEDIA_VIDEO]["coneInnerAngle"]
    ),
    coneOuterAngle: useOptionalParam(
      node,
      editor,
      "scene",
      "mediaConeOuterAngle",
      Defaults[SourceType.MEDIA_VIDEO]["coneOuterAngle"]
    ),
    coneOuterGain: useOptionalParam(
      node,
      editor,
      "scene",
      "mediaConeOuterGain",
      Defaults[SourceType.MEDIA_VIDEO]["coneOuterGain"]
    )
  };
  const avatarParamProps = {
    distanceModel: useOptionalParam(
      node,
      editor,
      "scene",
      "avatarDistanceModel",
      Defaults[SourceType.AVATAR_AUDIO_SOURCE]["distanceModel"]
    ),
    rolloffFactor: useOptionalParam(
      node,
      editor,
      "scene",
      "avatarRolloffFactor",
      Defaults[SourceType.AVATAR_AUDIO_SOURCE]["rolloffFactor"]
    ),
    refDistance: useOptionalParam(
      node,
      editor,
      "scene",
      "avatarRefDistance",
      Defaults[SourceType.AVATAR_AUDIO_SOURCE]["refDistance"]
    ),
    maxDistance: useOptionalParam(
      node,
      editor,
      "scene",
      "avatarMaxDistance",
      Defaults[SourceType.AVATAR_AUDIO_SOURCE]["maxDistance"]
    )
  };

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
            {...avatarParamProps.distanceModel}
          >
            <SelectInput
              options={DistanceModelOptions}
              value={node.avatarDistanceModel}
              onChange={avatarParamProps.distanceModel.onChange}
            />
          </InputGroup>

          {node.avatarDistanceModel === DistanceModelType.linear ? (
            <InputGroup
              name="Avatar Rolloff Factor"
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
              {...avatarParamProps.rolloffFactor}
            >
              <CompoundNumericInput
                min={0}
                max={1}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                value={node.avatarRolloffFactor}
                onChange={avatarParamProps.rolloffFactor.onChange}
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
              onChange={avatarParamProps.rolloffFactor.onChange}
              {...avatarParamProps.rolloffFactor}
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
            unit="m"
            onChange={avatarParamProps.refDistance.onChange}
            {...avatarParamProps.refDistance}
          />
          <NumericInputGroup
            name="Avatar Max Distance"
            info="A double value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further."
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.avatarMaxDistance}
            unit="m"
            onChange={avatarParamProps.maxDistance.onChange}
            {...avatarParamProps.maxDistance}
          />
          <InputGroup name="Media Volume" {...mediaParamProps.gain}>
            <CompoundNumericInput value={node.mediaVolume} onChange={mediaParamProps.gain.onChange} />
          </InputGroup>
          <InputGroup
            name="Media Distance Model"
            info="The algorithim used to calculate audio rolloff."
            {...mediaParamProps.distanceModel}
          >
            <SelectInput
              options={DistanceModelOptions}
              value={node.mediaDistanceModel}
              onChange={mediaParamProps.distanceModel.onChange}
            />
          </InputGroup>

          {node.mediaDistanceModel === DistanceModelType.linear ? (
            <InputGroup
              name="Media Rolloff Factor"
              info="A double value describing how quickly the volume is reduced as the source moves away from the listener. 0 to 1"
              {...mediaParamProps.rolloffFactor}
            >
              <CompoundNumericInput
                min={0}
                max={1}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                value={node.mediaRolloffFactor}
                onChange={mediaParamProps.rolloffFactor.onChange}
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
              onChange={mediaParamProps.rolloffFactor.onChange}
              {...mediaParamProps.rolloffFactor}
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
            unit="m"
            onChange={mediaParamProps.refDistance.onChange}
            {...mediaParamProps.refDistance}
          />
          <NumericInputGroup
            name="Media Max Distance"
            info="A double value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further."
            min={0}
            smallStep={0.1}
            mediumStep={1}
            largeStep={10}
            value={node.mediaMaxDistance}
            unit="m"
            onChange={mediaParamProps.maxDistance.onChange}
            {...mediaParamProps.maxDistance}
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
            unit="°"
            onChange={mediaParamProps.coneInnerAngle.onChange}
            {...mediaParamProps.coneInnerAngle}
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
            unit="°"
            onChange={mediaParamProps.coneOuterAngle.onChange}
            {...mediaParamProps.coneOuterAngle}
          />
          <InputGroup
            name="Media Cone Outer Gain"
            info="A double value describing the amount of volume reduction outside the cone defined by the coneOuterGain attribute. Its default value is 0, meaning that no sound can be heard."
            {...mediaParamProps.coneOuterGain}
          >
            <CompoundNumericInput
              min={0}
              max={1}
              step={0.01}
              value={node.mediaConeOuterGain}
              onChange={mediaParamProps.coneOuterGain.onChange}
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
