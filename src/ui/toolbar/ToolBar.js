import React, { Component } from "react";
import PropTypes from "prop-types";
import { showMenu, ContextMenu, MenuItem, SubMenu } from "../layout/ContextMenu";
import ReactTooltip from "react-tooltip";
import ToolButton from "./ToolButton";
import { Button } from "../inputs/Button";
import SelectInput from "../inputs/SelectInput";
import NumericStepperInput from "../inputs/NumericStepperInput";
import { TransformMode, SnapMode, TransformPivot } from "../../editor/controls/SpokeControls";
import { TransformSpace } from "../../editor/Editor";
import { ArrowsAlt } from "styled-icons/fa-solid/ArrowsAlt";
import { SyncAlt } from "styled-icons/fa-solid/SyncAlt";
import { ArrowsAltV } from "styled-icons/fa-solid/ArrowsAltV";
import { Globe } from "styled-icons/fa-solid/Globe";
import { Bullseye } from "styled-icons/fa-solid/Bullseye";
import { Magnet } from "styled-icons/fa-solid/Magnet";
import { Bars } from "styled-icons/fa-solid/Bars";
import { Grid } from "styled-icons/boxicons-regular/Grid";
import styled from "styled-components";
import styledTheme from "../theme";

const StyledToolbar = styled.div`
  display: flex;
  flex-direction: row;
  height: 40px;
  background-color: ${props => props.theme.toolbar};
  user-select: none;
`;

const ToolButtons = styled.div`
  width: auto;
  height: inherit;
  display: flex;
  flex-direction: row;
`;

const ToolToggles = styled.div`
  width: auto;
  height: inherit;
  display: flex;
  flex-direction: row;
  background-color: ${props => props.theme.toolbar2};
  align-items: center;
  padding: 0 16px;
`;

const Spacer = styled.div`
  flex: 1;
`;

const ToolTip = styled(ReactTooltip)`
  max-width: 200px;
  overflow: hidden;
  overflow-wrap: break-word;
  user-select: none;
`;

const PublishButton = styled(Button)`
  align-self: center;
  margin: 1em;
  padding: 0 2em;
`;

const snapInputStyles = {
  container: base => ({
    ...base,
    width: "80px"
  }),
  control: base => ({
    ...base,
    backgroundColor: styledTheme.inputBackground,
    minHeight: "24px",
    borderRadius: "0px",
    borderWidth: "0px",
    cursor: "pointer",
    outline: "none",
    boxShadow: "none"
  })
};

const rightSnapInputStyles = {
  container: base => ({
    ...base,
    width: "80px"
  }),
  control: base => ({
    ...base,
    backgroundColor: styledTheme.inputBackground,
    minHeight: "24px",
    borderTopLeftRadius: "0px",
    borderBottomLeftRadius: "0px",
    borderWidth: "0px 0px 0px 1px",
    borderColor: styledTheme.border,
    cursor: "pointer",
    outline: "none",
    boxShadow: "none",
    ":hover": {
      borderColor: styledTheme.border
    }
  })
};

const selectInputStyles = {
  container: base => ({
    ...base,
    width: "100px"
  }),
  control: base => ({
    ...base,
    backgroundColor: styledTheme.inputBackground,
    minHeight: "24px",
    borderTopLeftRadius: "0px",
    borderBottomLeftRadius: "0px",
    borderWidth: "0px",
    cursor: "pointer",
    outline: "none",
    boxShadow: "none"
  })
};

const ToggleButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  background-color: ${props => (props.value ? props.theme.blue : props.theme.toolbar)};
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;

  :hover {
    background-color: ${props => props.theme.blueHover};
  }

  :active {
    background-color: ${props => props.theme.blue};
  }
`;

const ToolbarInputGroup = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  margin: 0 4px;
`;

const ToolbarNumericStepperInput = styled(NumericStepperInput)`
  width: 100px;

  input {
    border-width: 0;
  }

  button {
    border-width: 0px 1px 0px 1px;

    &:first-child {
      border-radius: 0;
    }

    &:last-child {
      border-right-width: 0;
    }
  }
`;

const translationSnapOptions = [
  { label: "0.1m", value: 0.1 },
  { label: "0.125m", value: 0.125 },
  { label: "0.25m", value: 0.25 },
  { label: "0.5m", value: 0.5 },
  { label: "1m", value: 1 },
  { label: "2m", value: 2 },
  { label: "4m", value: 4 }
];

const rotationSnapOptions = [
  { label: "1°", value: 1 },
  { label: "5°", value: 5 },
  { label: "10°", value: 10 },
  { label: "15°", value: 15 },
  { label: "30°", value: 30 },
  { label: "45°", value: 45 },
  { label: "90°", value: 90 }
];

const transformPivotOptions = [
  { label: "Selection", value: TransformPivot.Selection },
  { label: "Center", value: TransformPivot.Center },
  { label: "Bottom", value: TransformPivot.Bottom }
];

const transformSpaceOptions = [
  { label: "Selection", value: TransformSpace.LocalSelection },
  { label: "World", value: TransformSpace.World }
];

export default class ToolBar extends Component {
  static propTypes = {
    menu: PropTypes.array,
    editor: PropTypes.object,
    onPublish: PropTypes.func,
    onOpenScene: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      editorInitialized: false,
      menuOpen: false
    };
  }

  componentDidMount() {
    const editor = this.props.editor;
    editor.addListener("initialized", this.onEditorInitialized);
  }

  onEditorInitialized = () => {
    const editor = this.props.editor;
    editor.spokeControls.addListener("transformModeChanged", this.onSpokeControlsChanged);
    editor.spokeControls.addListener("transformSpaceChanged", this.onSpokeControlsChanged);
    editor.spokeControls.addListener("transformPivotChanged", this.onSpokeControlsChanged);
    editor.spokeControls.addListener("snapSettingsChanged", this.onSpokeControlsChanged);
    editor.addListener("gridHeightChanged", this.onSpokeControlsChanged);
    editor.addListener("gridVisibilityChanged", this.onSpokeControlsChanged);
    this.setState({ editorInitialized: true });
  };

  componentWillUnmount() {
    const editor = this.props.editor;
    editor.removeListener("initialized", this.onEditorInitialized);

    if (editor.spokeControls) {
      editor.spokeControls.removeListener("transformModeChanged", this.onSpokeControlsChanged);
      editor.spokeControls.removeListener("transformSpaceChanged", this.onSpokeControlsChanged);
      editor.spokeControls.removeListener("transformPivotChanged", this.onSpokeControlsChanged);
      editor.spokeControls.removeListener("snapSettingsChanged", this.onSpokeControlsChanged);
      editor.removeListener("gridHeightChanged", this.onSpokeControlsChanged);
      editor.addListener("gridVisibilityChanged", this.onSpokeControlsChanged);
    }
  }

  onSpokeControlsChanged = () => {
    this.forceUpdate();
  };

  onMenuSelected = e => {
    if (!this.state.menuOpen) {
      const x = 0;
      const y = e.currentTarget.offsetHeight;
      showMenu({
        position: { x, y },
        target: e.currentTarget,
        id: "menu"
      });

      this.setState({ menuOpen: true });
      window.addEventListener("mousedown", this.onWindowClick);
    }
  };

  onWindowClick = () => {
    window.removeEventListener("mousedown", this.onWindowClick);
    this.setState({ menuOpen: false });
  };

  renderMenu = menu => {
    if (!menu.items || menu.items.length === 0) {
      return (
        <MenuItem key={menu.name} onClick={menu.action}>
          {menu.name}
          {menu.hotkey && <div>{menu.hotkey}</div>}
        </MenuItem>
      );
    } else {
      return (
        <SubMenu key={menu.name} title={menu.name} hoverDelay={0}>
          {menu.items.map(item => {
            return this.renderMenu(item);
          })}
        </SubMenu>
      );
    }
  };

  onSelectTranslate = () => {
    this.props.editor.spokeControls.setTransformMode(TransformMode.Translate);
  };

  onSelectRotate = () => {
    this.props.editor.spokeControls.setTransformMode(TransformMode.Rotate);
  };

  onSelectScale = () => {
    this.props.editor.spokeControls.setTransformMode(TransformMode.Scale);
  };

  onToggleTransformSpace = () => {
    this.props.editor.spokeControls.toggleTransformSpace();
  };

  onChangeTransformPivot = transformPivot => {
    this.props.editor.spokeControls.setTransformPivot(transformPivot);
  };

  onToggleTransformPivot = () => {
    this.props.editor.spokeControls.changeTransformPivot();
  };

  onToggleSnapMode = () => {
    this.props.editor.spokeControls.toggleSnapMode();
  };

  onChangeTranslationSnap = translationSnap => {
    this.props.editor.spokeControls.setTranslationSnap(parseFloat(translationSnap));
    this.props.editor.spokeControls.setSnapMode(SnapMode.Grid);
  };

  onChangeScaleSnap = scaleSnap => {
    this.props.editor.spokeControls.setScaleSnap(scaleSnap);
  };

  onChangeRotationSnap = rotationSnap => {
    this.props.editor.spokeControls.setRotationSnap(parseFloat(rotationSnap));
    this.props.editor.spokeControls.setSnapMode(SnapMode.Grid);
  };

  onChangeGridHeight = value => {
    this.props.editor.setGridHeight(value);
  };

  onToggleGridVisible = () => {
    this.props.editor.toggleGridVisible();
  };

  render() {
    const { editorInitialized, menuOpen } = this.state;

    if (!editorInitialized) {
      return <StyledToolbar />;
    }

    const {
      transformMode,
      transformSpace,
      transformPivot,
      snapMode,
      translationSnap,
      rotationSnap
    } = this.props.editor.spokeControls;

    return (
      <StyledToolbar>
        <ToolButtons>
          <ToolButton icon={Bars} onClick={this.onMenuSelected} selected={menuOpen} id="menu" />
          <ToolButton
            tooltip="[T] Translate"
            icon={ArrowsAlt}
            onClick={this.onSelectTranslate}
            selected={transformMode === TransformMode.Translate}
          />
          <ToolButton
            tooltip="[R] Rotate"
            icon={SyncAlt}
            onClick={this.onSelectRotate}
            selected={transformMode === TransformMode.Rotate}
          />
          <ToolButton
            tooltip="[Y] Scale"
            icon={ArrowsAltV}
            onClick={this.onSelectScale}
            selected={transformMode === TransformMode.Scale}
          />
        </ToolButtons>
        <ToolToggles>
          <ToolbarInputGroup>
            <ToggleButton
              onClick={this.onToggleTransformSpace}
              data-tip="[Z] Toggle Transform Space"
              data-for="toolbar"
              data-delay-show="500"
              data-place="bottom"
            >
              <Globe size={12} />
            </ToggleButton>
            <SelectInput
              styles={selectInputStyles}
              onChange={this.onChangeTransformSpace}
              options={transformSpaceOptions}
              value={transformSpace}
            />
          </ToolbarInputGroup>
          <ToolbarInputGroup>
            <ToggleButton
              onClick={this.onToggleTransformPivot}
              data-tip="[X] Toggle Transform Pivot"
              data-for="toolbar"
              data-delay-show="500"
              data-place="bottom"
            >
              <Bullseye size={12} />
            </ToggleButton>
            <SelectInput
              styles={selectInputStyles}
              onChange={this.onChangeTransformPivot}
              options={transformPivotOptions}
              value={transformPivot}
            />
          </ToolbarInputGroup>
          <ToolbarInputGroup>
            <ToggleButton
              value={snapMode === SnapMode.Grid}
              onClick={this.onToggleSnapMode}
              data-tip="[C] Toggle Snap Mode"
              data-for="toolbar"
              data-delay-show="500"
              data-place="bottom"
            >
              <Magnet size={12} />
            </ToggleButton>
            <SelectInput
              styles={snapInputStyles}
              onChange={this.onChangeTranslationSnap}
              options={translationSnapOptions}
              value={translationSnap}
              placeholder={translationSnap + "m"}
              formatCreateLabel={value => "Custom: " + value + "m"}
              isValidNewOption={value => value.trim() !== "" && !isNaN(value)}
              creatable
            />
            <SelectInput
              styles={rightSnapInputStyles}
              onChange={this.onChangeRotationSnap}
              options={rotationSnapOptions}
              value={rotationSnap}
              placeholder={rotationSnap + "°"}
              formatCreateLabel={value => "Custom: " + value + "°"}
              isValidNewOption={value => value.trim() !== "" && !isNaN(value)}
              creatable
            />
          </ToolbarInputGroup>
          <ToolbarInputGroup>
            <ToggleButton
              onClick={this.onToggleGridVisible}
              data-tip="Toggle Grid Visibility"
              data-for="toolbar"
              data-delay-show="500"
              data-place="bottom"
            >
              <Grid size={16} />
            </ToggleButton>
            <ToolbarNumericStepperInput
              value={this.props.editor.grid.position.y}
              onChange={this.onChangeGridHeight}
              precision={0.01}
              smallStep={0.25}
              mediumStep={1.5}
              largeStep={4.5}
              unit="m"
            />
          </ToolbarInputGroup>
        </ToolToggles>
        <Spacer />
        {this.props.editor.sceneUrl && <PublishButton onClick={this.props.onOpenScene}>Open in Hubs</PublishButton>}
        <PublishButton id="publish-button" onClick={this.props.onPublish}>
          Publish to Hubs...
        </PublishButton>
        <ContextMenu id="menu">
          {this.props.menu.map(menu => {
            return this.renderMenu(menu);
          })}
        </ContextMenu>
        <ToolTip id="toolbar" />
      </StyledToolbar>
    );
  }
}
