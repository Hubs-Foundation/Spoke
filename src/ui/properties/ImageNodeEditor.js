import React from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";
import { ImageProjection } from "../../editor/objects/Image";
import ImageInput from "../inputs/ImageInput";
import { Image } from "styled-icons/fa-solid/Image";
import useSetPropertySelected from "./useSetPropertySelected";

const imageProjectionOptions = Object.values(ImageProjection).map(v => ({ label: v, value: v }));

export default function ImageNodeEditor(props) {
  const { editor, node } = props;
  const onChangeSrc = useSetPropertySelected(editor, "src");
  const onChangeControls = useSetPropertySelected(editor, "controls");
  const onChangeProjection = useSetPropertySelected(editor, "projection");

  return (
    <NodeEditor description={ImageNodeEditor.description} {...props}>
      <InputGroup name="Image Url">
        <ImageInput value={node.src} onChange={onChangeSrc} />
      </InputGroup>
      <InputGroup name="Controls" info="Toggle the visibility of the media controls in Hubs.">
        <BooleanInput value={node.controls} onChange={onChangeControls} />
      </InputGroup>
      <InputGroup name="Projection">
        <SelectInput options={imageProjectionOptions} value={node.projection} onChange={onChangeProjection} />
      </InputGroup>
    </NodeEditor>
  );
}

ImageNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object,
  multiEdit: PropTypes.bool
};

ImageNodeEditor.iconComponent = Image;

ImageNodeEditor.description = "Dynamically loads an image.";
