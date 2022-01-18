import React from "react";
import NodeEditor from "./NodeEditor";
import { Mirror } from "styled-icons/octicons/Mirror";

export default function MirrorNodeEditor(props) {
  return (
    <NodeEditor {...props} description={MirrorNodeEditor.description} />
  );
}

MirrorNodeEditor.iconComponent = Mirror;

MirrorNodeEditor.description = "It's reflect mirror. But, can't see my avatar's head.";
