import React, { useEffect, useRef, useCallback, useContext, useState } from "react";
import PropTypes from "prop-types";
import { EditorContext } from "../contexts/EditorContext";
import styled from "styled-components";
import Panel from "../layout/Panel";
import { WindowMaximize } from "styled-icons/fa-solid/WindowMaximize";
import { Resizeable } from "../layout/Resizeable";
import AssetsPanel from "../assets/AssetsPanel";
import { useDrop } from "react-dnd";
import { ItemTypes, AssetTypes, addAssetAtCursorPositionOnDrop } from "../dnd";
import SelectInput from "../inputs/SelectInput";
import { TransformMode } from "../../editor/controls/SpokeControls";
import AssetDropZone from "../assets/AssetDropZone";
import { ChartArea } from "styled-icons/fa-solid/ChartArea";
import { InfoTooltip } from "../layout/Tooltip";
import Stats from "./Stats";

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

const ViewportToolbarContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  flex: 1;
`;

const ToolbarIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  background-color: ${props => (props.value ? props.theme.blue : "transparent")};
  cursor: pointer;

  :hover {
    background-color: ${props => (props.value ? props.theme.blueHover : props.theme.hover)};
  }

  :active {
    background-color: ${props => (props.value ? props.theme.bluePressed : props.theme.hover2)};
  }
`;

const initialPanelSizes = [0.8, 0.2];

function IconToggle({ icon: Icon, value, onClick, tooltip, ...rest }) {
  const onToggle = useCallback(() => {
    onClick(!value);
  }, [value, onClick]);

  return (
    <InfoTooltip info={tooltip}>
      <ToolbarIconContainer onClick={onToggle} value={value} {...rest}>
        <Icon size={14} />
      </ToolbarIconContainer>
    </InfoTooltip>
  );
}

IconToggle.propTypes = {
  icon: PropTypes.elementType,
  value: PropTypes.bool,
  onClick: PropTypes.func,
  tooltip: PropTypes.string
};

const selectInputStyles = {
  container: base => ({
    ...base,
    width: "120px"
  }),
  control: (base, { isFocused, theme }) => ({
    ...base,
    backgroundColor: "transparent",
    minHeight: "20px",
    borderRadius: "0px",
    borderWidth: "0px 1px",
    borderStyle: "solid",
    borderColor: isFocused ? theme.colors.primary : "rgba(255, 255, 255, 0.2)",
    cursor: "pointer",
    outline: "none",
    boxShadow: "none"
  })
};

function ViewportToolbar({ onToggleStats, showStats }) {
  const editor = useContext(EditorContext);

  const renderer = editor.renderer;
  const [renderMode, setRenderMode] = useState(renderer && renderer.renderMode);

  const options = renderer
    ? renderer.renderModes.map(mode => ({
        label: mode.name,
        value: mode
      }))
    : [];

  useEffect(() => {
    editor.addListener("initialized", () => {
      setRenderMode(editor.renderer.renderMode);
    });
  }, [editor]);

  const onChangeRenderMode = useCallback(
    mode => {
      editor.renderer.setRenderMode(mode);
      setRenderMode(mode);
    },
    [editor, setRenderMode]
  );

  return (
    <ViewportToolbarContainer>
      <IconToggle onClick={onToggleStats} value={showStats} tooltip="Toggle Stats" icon={ChartArea} />
      <SelectInput value={renderMode} options={options} onChange={onChangeRenderMode} styles={selectInputStyles} />
    </ViewportToolbarContainer>
  );
}

ViewportToolbar.propTypes = {
  showStats: PropTypes.bool,
  onToggleStats: PropTypes.func
};

export default function ViewportPanelContainer() {
  const editor = useContext(EditorContext);
  const canvasRef = useRef();
  const [flyModeEnabled, setFlyModeEnabled] = useState(false);
  const [objectSelected, setObjectSelected] = useState(false);
  const [transformMode, setTransformMode] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const onSelectionChanged = useCallback(() => {
    setObjectSelected(editor.selected.length > 0);
  }, [editor]);

  const onFlyModeChanged = useCallback(() => {
    setFlyModeEnabled(editor.flyControls.enabled);
  }, [editor, setFlyModeEnabled]);

  const onTransformModeChanged = useCallback(mode => {
    setTransformMode(mode);
  }, []);

  const onResize = useCallback(() => {
    editor.onResize();
  }, [editor]);

  const onEditorInitialized = useCallback(() => {
    editor.addListener("selectionChanged", onSelectionChanged);
    editor.spokeControls.addListener("flyModeChanged", onFlyModeChanged);
    editor.spokeControls.addListener("transformModeChanged", onTransformModeChanged);
  }, [editor, onSelectionChanged, onFlyModeChanged, onTransformModeChanged]);

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

  const onAfterUploadAssets = useCallback(
    assets => {
      Promise.all(
        assets.map(({ url }) => {
          editor.addMedia(url);
        })
      ).catch(err => {
        editor.emit("error", err);
      });
    },
    [editor]
  );

  let controlsText;

  if (flyModeEnabled) {
    controlsText = "[W][A][S][D] Move Camera | [Shift] Fly faster";
  } else {
    controlsText = "[LMB] Orbit / Select | [MMB] Pan | [RMB] Fly";
  }

  if (objectSelected) {
    controlsText += " | [F] Focus | [Q] Rotate Left | [E] Rotate Right";
  }

  if (transformMode === TransformMode.Placement) {
    controlsText += " | [ESC / G] Cancel Placement";
  } else if (transformMode === TransformMode.Grab) {
    controlsText += " | [Shift + Click] Place Duplicate | [ESC / G] Cancel Grab";
  } else if (objectSelected) {
    controlsText += "| [G] Grab | [ESC] Deselect All";
  }

  // id used in onboarding
  return (
    <Panel
      id="viewport-panel"
      title="Viewport"
      icon={WindowMaximize}
      toolbarContent={<ViewportToolbar onToggleStats={setShowStats} showStats={showStats} />}
    >
      <Resizeable axis="y" onChange={onResize} min={0.01} initialSizes={initialPanelSizes}>
        <ViewportContainer error={isOver && !canDrop} canDrop={isOver && canDrop} ref={dropRef}>
          <Viewport ref={canvasRef} tabIndex="-1" />
          <ControlsText>{controlsText}</ControlsText>
          {showStats && <Stats editor={editor} />}
          <AssetDropZone afterUpload={onAfterUploadAssets} />
        </ViewportContainer>
        <AssetsPanel />
      </Resizeable>
    </Panel>
  );
}
