import React from "react";
import NodeEditor from "./NodeEditor";
import { Cubes } from "styled-icons/fa-solid/Cubes";

export default function GroupNodeEditor(props) {
  return <NodeEditor {...props} description={GroupNodeEditor.description} />;
}

GroupNodeEditor.iconComponent = Cubes;

GroupNodeEditor.description =
  "A group of multiple objects that can be moved or duplicated together.\nDrag and drop objects into the Group in the Hierarchy.";
