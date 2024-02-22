/**
 * belivvr custom
 * 화면공유(칠판)을 스포크 에디터에 추가함
 */

import React from "react";
import NodeEditor from "./NodeEditor";
import { Chalkboard } from "styled-icons/fa-solid/Chalkboard";
import PropTypes from "prop-types";
import useSetPropertySelected from "./useSetPropertySelected";

import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import CompoundNumericInput from "../inputs/CompoundNumericInput";

export default function SharedScreenNodeEditor(props) {
    const { editor, node } = props;

    const onChangeColor = useSetPropertySelected(editor, "color");
    const onChangeOpacity = useSetPropertySelected(editor, "opacity");

    return (
        <NodeEditor {...props} description={SharedScreenNodeEditor.description}>
            <InputGroup name="Color">
                <ColorInput value={node.color} onChange={onChangeColor} />
            </InputGroup>
            <InputGroup name="Opacity">
                <CompoundNumericInput min={0} max={1} step={0.01} value={node.opacity} onChange={onChangeOpacity} />
            </InputGroup>
        </NodeEditor>
    );
}

SharedScreenNodeEditor.iconComponent = Chalkboard;

SharedScreenNodeEditor.description = "It's a shared screen! You can share any media on the screen.";

SharedScreenNodeEditor.propTypes = {
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
};