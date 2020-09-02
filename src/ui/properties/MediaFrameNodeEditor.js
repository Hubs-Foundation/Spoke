import React from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { ObjectGroup } from "styled-icons/fa-solid/ObjectGroup";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import useSetPropertySelected from "./useSetPropertySelected";
import { MediaType } from "../../editor/nodes/MediaFrameNode";

const mediaTypeOptions = [
  { label: "All Media", value: MediaType.ALL },
  { label: "Only 2D Media", value: MediaType.ALL_2D },
  { label: "Only 3D Models", value: MediaType.MODEL },
  { label: "Only Images", value: MediaType.IMAGE },
  { label: "Only Videos", value: MediaType.VIDEO },
  { label: "Only PDFs", value: MediaType.PDF }
];

export default function MediaFrameNodeEditor(props) {
  const { node, editor } = props;
  const onChangeMediaType = useSetPropertySelected(editor, "mediaType");
  return (
    <NodeEditor description={MediaFrameNodeEditor.description} {...props}>
      <InputGroup name="Media Types" info="Limit what type of media this frame will capture">
        <SelectInput options={mediaTypeOptions} value={node.mediaType} onChange={onChangeMediaType} />
      </InputGroup>
    </NodeEditor>
  );
}

MediaFrameNodeEditor.iconComponent = ObjectGroup;
MediaFrameNodeEditor.description = "A frame to capture media objects.\n";

MediaFrameNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object
};
