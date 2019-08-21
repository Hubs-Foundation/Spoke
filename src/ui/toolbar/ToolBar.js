import React, { Component } from "react";
import PropTypes from "prop-types";
import { showMenu, ContextMenu, MenuItem, SubMenu } from "react-contextmenu";
import { Link } from "react-router-dom";
import ReactTooltip from "react-tooltip";

import ToolButton from "./ToolButton";
import Button from "../inputs/Button";
import ToolToggle from "./ToolToggle";
import styles from "./ToolBar.scss";
import SnappingDropdown from "./SnappingDropdown";
import SpokeIcon from "../../assets/spoke-icon.png";
import { TransformMode, SnapMode, TransformPivot } from "../../editor/controls/SpokeControls";
import { TransformSpace } from "../../editor/Editor";

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
          {menu.hotkey && <div className={styles.menuHotkey}>{menu.hotkey}</div>}
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

  onChangeRotationSnap = rotationSnap => {
    this.props.editor.spokeControls.setRotationSnap(rotationSnap);
  };

  render() {
    const { editorInitialized, menuOpen } = this.state;

    if (!editorInitialized) {
      return <div className={styles.toolbar} />;
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
      <div className={styles.toolbar}>
        <div className={styles.logo}>
          <Link to="/" className={styles.logoContent}>
            <img src={SpokeIcon} />
            <div>spoke</div>
          </Link>
        </div>
        <div className={styles.toolbtns}>
          <ToolButton iconClass="fa-bars" onClick={this.onMenuSelected} selected={menuOpen} id="menu" />
          <ToolButton
            tooltip="[W] Translate"
            iconClass="fa-arrows-alt"
            onClick={this.onSelectTranslate}
            selected={transformMode === TransformMode.Translate}
          />
          <ToolButton
            tooltip="[E] Rotate"
            iconClass="fa-sync-alt"
            onClick={this.onSelectRotate}
            selected={transformMode === TransformMode.Rotate}
          />
          <ToolButton
            tooltip="[R] Scale"
            iconClass="fa-arrows-alt-v"
            onClick={this.onSelectScale}
            selected={transformMode === TransformMode.Scale}
          />
        </div>
        <div className={styles.tooltoggles}>
          <ToolToggle
            text={["Global", "Local"]}
            tooltip="[Z] Toggle Transform Space"
            action={this.onToggleTransformSpace}
            icons={{
              checked: "fa-cube",
              unchecked: "fa-globe"
            }}
            isSwitch
            isChecked={transformSpace === TransformSpace.LocalSelection}
          />
          <ToolToggle
            text={["Selection", "Center"]}
            tooltip="[C] Toggle Transform Pivot"
            action={this.onToggleTransformPivot}
            icons={{
              checked: "fa-cube",
              unchecked: "fa-globe"
            }}
            isSwitch
            isChecked={transformPivot === TransformPivot.Center}
          />
          <ToolToggle
            text={["Snapping", "Grid"]}
            tooltip="[X] Toggle Snap Mode"
            action={this.onToggleSnapMode}
            icons={{
              checked: "fa-magnet",
              unchecked: "fa-magnet"
            }}
            isChecked={snapMode === SnapMode.Grid}
          >
            <SnappingDropdown
              translationSnap={translationSnap}
              rotationSnap={rotationSnap}
              onChangeTranslationSnap={this.onChangeTranslationSnap}
              onChangeRotationSnap={this.onChangeRotationSnap}
            />
          </ToolToggle>
        </div>
        <div className={styles.spacer} />
        {this.props.editor.sceneUrl && (
          <Button className={styles.publishButton} onClick={this.props.onOpenScene}>
            Open in Hubs
          </Button>
        )}
        <Button id="publish-button" className={styles.publishButton} onClick={this.props.onPublish}>
          Publish to Hubs...
        </Button>
        <ContextMenu id="menu">
          {this.props.menu.map(menu => {
            return this.renderMenu(menu);
          })}
        </ContextMenu>
        <ReactTooltip id="toolbar" className={styles.tooltip} />
      </div>
    );
  }
}
