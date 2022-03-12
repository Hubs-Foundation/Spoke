import React from "react";
import PropTypes from "prop-types";
import { Mirror } from "styled-icons/octicons/Mirror";

import useSetPropertySelected from "./useSetPropertySelected";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";

export default function MirrorNodeEditor(props) {
  const { node, editor } = props;
  const onChangeColor = useSetPropertySelected(editor, "color");

  return (
    <NodeEditor {...props} description={MirrorNodeEditor.description}>
      <InputGroup name="Color">
        <ColorInput value={node.color} onChange={onChangeColor} />
      </InputGroup>
    </NodeEditor>
  );
}

MirrorNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object
};

MirrorNodeEditor.iconComponent = Mirror;

MirrorNodeEditor.description = "Renders a plane mirror.";
