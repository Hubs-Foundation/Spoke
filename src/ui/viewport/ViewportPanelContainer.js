import React, { useEffect, useRef, useCallback, useContext, useState } from "react";
import { EditorContext } from "../contexts/EditorContext";
import styled from "styled-components";
import Panel from "../layout/Panel";
import { WindowMaximize } from "styled-icons/fa-solid/WindowMaximize";
import { Resizeable } from "../layout/Resizeable";
import AssetsPanel from "../assets/AssetsPanel";
import { useDrop } from "react-dnd";
import { ItemTypes, AssetTypes, addAssetAtCursorPositionOnDrop } from "../dnd";

function borderColor(props, defaultColor) {
  if (props.canDrop) {
    return props.theme.blue;
  } else if (props.error) {
    return props.theme.error;
  } else {
    return defaultColor;
  }
}

const Viewport = styled.canvas`
  width: 100%;
  height: 100%;
  position: relative;
`;

const ViewportContainer = styled.div`
  display: flex;
  flex: 1;
  position: relative;

  ::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    content: "";
    pointer-events: none;
    border: 1px solid ${props => borderColor(props, "transparent")};
  }
`;

const ControlsText = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  pointer-events: none;
  color: white;
  padding: 8px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
`;

const initialPanelSizes = [0.8, 0.2];

export default function ViewportPanelContainer() {
  const editor = useContext(EditorContext);
  const canvasRef = useRef();
  const [flyModeEnabled, setFlyModeEnabled] = useState(false);
  const [objectSelected, setObjectSelected] = useState(false);

  const onSelectionChanged = useCallback(() => {
    setObjectSelected(editor.selected.length > 0);
  }, [editor]);

  const onFlyModeChanged = useCallback(() => {
    setFlyModeEnabled(editor.flyControls.enabled);
  }, [editor, setFlyModeEnabled]);

  const onResize = useCallback(() => {
    editor.onResize();
  }, [editor]);

  const onEditorInitialized = useCallback(() => {
    editor.addListener("selectionChanged", onSelectionChanged);
    editor.spokeControls.addListener("flyModeChanged", onFlyModeChanged);
  }, [editor, onSelectionChanged, onFlyModeChanged]);

  useEffect(() => {
    editor.addListener("initialized", onEditorInitialized);
    editor.initializeRenderer(canvasRef.current);

    return () => {
      editor.removeListener("selectionChanged", onSelectionChanged);

      if (editor.spokeControls) {
        editor.spokeControls.removeListener("flyModeChanged", onFlyModeChanged);
      }

      if (editor.renderer) {
        editor.renderer.dispose();
      }
    };
  }, [editor, canvasRef, onEditorInitialized, onSelectionChanged, onFlyModeChanged]);

  const [{ canDrop, isOver }, dropRef] = useDrop({
    accept: [ItemTypes.Node, ...AssetTypes],
    drop(item, monitor) {
      const mousePos = monitor.getClientOffset();

      if (item.type === ItemTypes.Node) {
        if (item.multiple) {
          editor.reparentToSceneAtCursorPosition(item.value, mousePos);
        } else {
          editor.reparentToSceneAtCursorPosition([item.value], mousePos);
        }

        return;
      }

      addAssetAtCursorPositionOnDrop(editor, item, mousePos);
    },
    collect: monitor => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    })
  });

  // id used in onboarding
  return (
    <Panel id="viewport-panel" title="Viewport" icon={WindowMaximize}>
      <Resizeable axis="y" onChange={onResize} min={0.01} initialSizes={initialPanelSizes}>
        <ViewportContainer error={isOver && !canDrop} canDrop={isOver && canDrop} ref={dropRef}>
          <Viewport ref={canvasRef} tabIndex="-1" />
          <ControlsText>
            {flyModeEnabled
              ? "[W][A][S][D] Move Camera | [Shift] Fly faster"
              : `[LMB] Orbit / Select | [MMB] Pan | [RMB] Fly ${objectSelected ? "| [F] Focus" : ""}`}
          </ControlsText>
        </ViewportContainer>
        <AssetsPanel />
      </Resizeable>
    </Panel>
  );
}
