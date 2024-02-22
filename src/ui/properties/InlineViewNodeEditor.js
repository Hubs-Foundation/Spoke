import React, { useEffect } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import StringInput from "../inputs/StringInput";
import SelectInput from "../inputs/SelectInput";
import ImageInput from "../inputs/ImageInput";
import { WindowRestore } from "styled-icons/fa-solid/WindowRestore";
import useSetPropertySelected from "./useSetPropertySelected";

export const options = {
  main: "Main",
  sideView: "Side view"
};

const frameOptions = Object.values(options).map(v => ({ label: v, value: v }));

export default function InlineViewNodeEditor(props) {
  const { editor, node } = props;

  const onChangeSrc = useSetPropertySelected(editor, "src");
  const onChangeInlineURL = useSetPropertySelected(editor, "inlineURL");
  const onChangeControls = useSetPropertySelected(editor, "controls");
  const onChangeBillboard = useSetPropertySelected(editor, "billboard");
  const onChangeFrameOption = useSetPropertySelected(editor, "frameOption");

  return (
    <NodeEditor description={InlineViewNodeEditor.description} {...props}>
      <InputGroup name="Image URL" info="Enter the address of the thumbnail image of the component that will appear in Hubs.">
        <ImageInput value={node.src} onChange={onChangeSrc} />
      </InputGroup>
        <InputGroup name="Inline URL" info="Enter the inline frame address that Hubs will use.">
          <StringInput value={node.inlineURL} onChange={onChangeInlineURL} />
        </InputGroup>
        <InputGroup
          name="Controls"
          info="Toggle the visibility of the media controls in Hubs. Does not billboard in Spoke."
        >
          <BooleanInput value={node.controls} onChange={onChangeControls} />
        </InputGroup>
        <InputGroup name="Billboard" info="Image always faces user in Hubs.">
          <BooleanInput value={node.billboard} onChange={onChangeBillboard} />
        </InputGroup>
        <InputGroup name="Frame Option">
          <SelectInput options={frameOptions} value={node.frameOption} onChange={onChangeFrameOption} />
        </InputGroup>
    </NodeEditor>
  );
}

InlineViewNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object,
  multiEdit: PropTypes.bool
};

InlineViewNodeEditor.iconComponent = WindowRestore;

InlineViewNodeEditor.description = `Link to a open another website by iframe`;
