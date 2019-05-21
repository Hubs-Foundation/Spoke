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
      toolButtons: [
        {
          id: "translate",
          tooltip: "[W] Translate",
          type: "fa-arrows-alt",
          onClick: () => this.onMoveSelected()
        },
        {
          id: "rotate",
          tooltip: "[E] Rotate",
          type: "fa-sync-alt",
          onClick: () => this.onRotateSelected()
        },
        {
          id: "scale",
          tooltip: "[R] Scale",
          type: "fa-arrows-alt-v",
          onClick: () => this.onScaleSelected()
        }
      ],
      spaceToggle: {
        tooltip: "[Z] Toggle Rotation Mode",
        type: "toggle",
        text: ["Global", "Local"],
        isSwitch: true,
        isChecked: false,
        icons: {
          checked: "fa-cube",
          unchecked: "fa-globe"
        },
        action: () => this.onRotationSpaceChanged()
      },
      snapToggle: {
        tooltip: "[X] Toggle Snap Mode",
        type: "toggle",
        text: ["Snapping", "Snapping"],
        children: <SnappingDropdown />,
        isSwitch: false,
        isChecked: false,
        icons: {
          checked: "fa-magnet",
          unchecked: "fa-magnet"
        },
        action: () => this.onSnappingChanged()
      },
      toolButtonSelected: "translate",
      menuOpen: false
    };
  }

  componentDidMount() {
    const editor = this.props.editor;
    editor.signals.transformModeChanged.add(this._updateToolBarStatus);
    editor.signals.spaceChanged.add(this._updateSpaceToggle);
    editor.signals.snapToggled.add(this._updateSnapToggle);
  }

  componentWillUnmount() {
    const editor = this.props.editor;
    editor.signals.transformModeChanged.remove(this._updateToolBarStatus);
    editor.signals.spaceChanged.remove(this._updateSpaceToggle);
    editor.signals.snapToggled.remove(this._updateSnapToggle);
  }

  _updateSnapToggle = () => {
    const current = this.state.snapToggle;
    current.isChecked = !current.isChecked;
    this.setState({ current });
  };

  _updateSpaceToggle = () => {
    const current = this.state.spaceToggle;
    current.isChecked = !current.isChecked;
    this.setState({ current });
  };

  _updateToolBarStatus = id => {
    this.setState({
      toolButtonSelected: id
    });
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

  onSelectionSelected = () => {
    this.props.editor.deselect();
    this._updateToolBarStatus("select");
  };

  onMoveSelected = () => {
    this.props.editor.viewport.spokeControls.setTransformControlsMode("translate");
  };

  onRotateSelected = () => {
    this.props.editor.viewport.spokeControls.setTransformControlsMode("rotate");
  };

  onScaleSelected = () => {
    this.props.editor.viewport.spokeControls.setTransformControlsMode("scale");
  };

  onRotationSpaceChanged = () => {
    this.props.editor.viewport.spokeControls.toggleRotationSpace();
  };

  onSnappingChanged = () => {
    this.props.editor.viewport.spokeControls.toggleSnapMode();
  };

  renderToolButtons = buttons => {
    return buttons.map(({ onClick, type, tooltip, id }) => {
      const selected = id === this.state.toolButtonSelected;
      return <ToolButton tooltip={tooltip} toolType={type} key={type} onClick={onClick} selected={selected} />;
    });
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
          {menu.items
            .filter(item => !!item)
            .map(item => {
              return this.renderMenu(item);
            })}
        </SubMenu>
      );
    }
  };

  render() {
    const { toolButtons, spaceToggle, snapToggle, menuOpen } = this.state;

    return (
      <div className={styles.toolbar}>
        <div className={styles.logo}>
          <Link to="/" className={styles.logoContent}>
            <img src={SpokeIcon} />
            <div>spoke</div>
          </Link>
        </div>
        <div className={styles.toolbtns}>
          <ToolButton toolType="fa-bars" onClick={this.onMenuSelected} selected={menuOpen} id="menu" />
          {this.renderToolButtons(toolButtons)}
        </div>
        <div className={styles.tooltoggles}>
          <ToolToggle
            text={spaceToggle.text}
            key={spaceToggle.name}
            tooltip={spaceToggle.tooltip}
            action={spaceToggle.action}
            icons={spaceToggle.icons}
            isSwitch={spaceToggle.isSwitch}
            isChecked={spaceToggle.isChecked}
            editor={this.props.editor}
          >
            {spaceToggle.children}
          </ToolToggle>
          <ToolToggle
            text={snapToggle.text}
            tooltip={snapToggle.tooltip}
            key={snapToggle.name}
            action={snapToggle.action}
            icons={snapToggle.icons}
            isSwitch={snapToggle.isSwitch}
            isChecked={snapToggle.isChecked}
            editor={this.props.editor}
          >
            {snapToggle.children}
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
          {this.props.menu
            .filter(item => !!item)
            .map(menu => {
              return this.renderMenu(menu);
            })}
        </ContextMenu>
        <ReactTooltip id="toolbar" className={styles.tooltip} />
      </div>
    );
  }
}
