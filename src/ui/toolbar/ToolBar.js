import React, { Component } from "react";
import PropTypes from "prop-types";
import { showMenu, ContextMenu, MenuItem, SubMenu } from "../layout/ContextMenu";
import { Link } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import ToolButton from "./ToolButton";
import { Button } from "../inputs/Button";
import ToolToggle from "./ToolToggle";
import SnappingDropdown from "./SnappingDropdown";
import SpokeIcon from "../../assets/spoke-icon.png";
import { TransformMode, SnapMode, TransformPivot } from "../../editor/controls/SpokeControls";
import { TransformSpace } from "../../editor/Editor";
import { ArrowsAlt } from "styled-icons/fa-solid/ArrowsAlt";
import { SyncAlt } from "styled-icons/fa-solid/SyncAlt";
import { ArrowsAltV } from "styled-icons/fa-solid/ArrowsAltV";
import { Cube } from "styled-icons/fa-solid/Cube";
import { Globe } from "styled-icons/fa-solid/Globe";
import { Bullseye } from "styled-icons/fa-solid/Bullseye";
import { ObjectGroup } from "styled-icons/fa-solid/ObjectGroup";
import { Magnet } from "styled-icons/fa-solid/Magnet";
import { Bars } from "styled-icons/fa-solid/Bars";
import styled from "styled-components";

const StyledToolbar = styled.div`
  display: flex;
  flex-direction: row;
  height: 40px;
  background-color: ${props => props.theme.toolbar};
  user-select: none;
`;

const Logo = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  text-align: center;
  font-family: ${props => props.theme.zilla};
  text-shadow: 0 0 4px black;
  font-size: 24px;
  width: 100%;
  margin-top: 4px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  pointer-events: none;

  a {
    color: white;
    text-decoration: none;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  pointer-events: all;

  img {
    width: 32px;
    height: 32px;
    margin-right: 5px;
  }
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
  padding-right: 16px;
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

  onToggleTransformPivot = () => {
    this.props.editor.spokeControls.toggleTransformPivot();
  };

  onToggleSnapMode = () => {
    this.props.editor.spokeControls.toggleSnapMode();
  };

  onChangeTranslationSnap = translationSnap => {
    this.props.editor.spokeControls.setTranslationSnap(translationSnap);
  };

  onChangeScaleSnap = scaleSnap => {
    this.props.editor.spokeControls.setScaleSnap(scaleSnap);
  };

  onChangeRotationSnap = rotationSnap => {
    this.props.editor.spokeControls.setRotationSnap(rotationSnap);
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
      rotationSnap,
      scaleSnap
    } = this.props.editor.spokeControls;

    return (
      <StyledToolbar>
        <Logo>
          <LogoLink to="/">
            <img src={SpokeIcon} />
            <div>spoke</div>
          </LogoLink>
        </Logo>
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
          <ToolToggle
            text={["Global", "Local"]}
            tooltip="[Z] Toggle Transform Space"
            action={this.onToggleTransformSpace}
            icons={{
              checked: <Cube size={12} />,
              unchecked: <Globe size={12} />
            }}
            isSwitch
            isChecked={transformSpace === TransformSpace.LocalSelection}
          />
          <ToolToggle
            text={["Selection", "Center"]}
            tooltip="[X] Toggle Transform Pivot"
            action={this.onToggleTransformPivot}
            icons={{
              checked: <Bullseye size={12} />,
              unchecked: <ObjectGroup size={12} />
            }}
            isSwitch
            isChecked={transformPivot === TransformPivot.Center}
          />
          <ToolToggle
            text={["Snapping", "Grid"]}
            tooltip="[C] Toggle Snap Mode"
            action={this.onToggleSnapMode}
            icons={{
              checked: <Magnet size={12} />,
              unchecked: <Magnet size={12} />
            }}
            isChecked={snapMode === SnapMode.Grid}
          >
            <SnappingDropdown
              translationSnap={translationSnap}
              rotationSnap={rotationSnap}
              scaleSnap={scaleSnap}
              onChangeTranslationSnap={this.onChangeTranslationSnap}
              onChangeRotationSnap={this.onChangeRotationSnap}
              onChangeScaleSnap={this.onChangeScaleSnap}
            />
          </ToolToggle>
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
