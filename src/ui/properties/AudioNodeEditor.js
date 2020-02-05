import React from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import AudioInput from "../inputs/AudioInput";
import { VolumeUp } from "styled-icons/fa-solid/VolumeUp";
import AudioSourceProperties from "./AudioSourceProperties";
import useSetPropertySelected from "./useSetPropertySelected";

export default function AudioNodeEditor(props) {
  const { editor, node } = props;
  const onChangeSrc = useSetPropertySelected(editor, "src");

  return (
    <NodeEditor description={AudioNodeEditor.description} {...props}>
      <InputGroup name="Audio Url">
        <AudioInput value={node.src} onChange={onChangeSrc} />
      </InputGroup>
      <AudioSourceProperties {...props} />
    </NodeEditor>
  );
}

AudioNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object,
  multiEdit: PropTypes.bool
};

AudioNodeEditor.iconComponent = VolumeUp;

AudioNodeEditor.description = "Dynamically loads audio.";
