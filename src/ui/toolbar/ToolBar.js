import React, { Component } from "react";
import PropTypes from "prop-types";
import { showMenu, ContextMenu, MenuItem, SubMenu } from "react-contextmenu";
import { Link } from "react-router-dom";

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
    onPublish: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      toolButtons: [
        {
          name: "menu",
          type: "fa-bars",
          onClick: e => this.onMenuSelected(e)
        },
        {
          name: "translate",
          type: "fa-arrows-alt",
          onClick: () => this.onMoveSelected()
        },
        {
          name: "rotate",
          type: "fa-sync-alt",
          onClick: () => this.onRotateSelected()
        },
        {
          name: "scale",
          type: "fa-arrows-alt-v",
          onClick: () => this.onScaleSelected()
        }
      ],
      spaceToggle: {
        name: "rotation-space",
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
        name: "snap",
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
      toolButtonSelected: "translate"
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

  _updateToolBarStatus = selectedBtnName => {
    this.setState({
      toolButtonSelected: selectedBtnName
    });
  };

  onMenuSelected = e => {
    const x = 0;
    const y = e.currentTarget.offsetHeight;
    showMenu({
      position: { x, y },
      target: e.currentTarget,
      id: "menu"
    });

    this._updateToolBarStatus("menu");
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
    return buttons.map(btn => {
      const { onClick, name, type } = btn;
      const selected = btn.name === this.state.toolButtonSelected;
      return <ToolButton toolType={type} key={type} onClick={onClick} selected={selected} id={name} />;
    });
  };

  renderMenu = menu => {
    if (!menu.items || menu.items.length === 0) {
      return (
        <MenuItem key={menu.name} onClick={menu.action}>
          {menu.name}
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

  render() {
    const { toolButtons, spaceToggle, snapToggle } = this.state;

    return (
      <div className={styles.toolbar}>
        <div className={styles.logo}>
          <Link to="/" className={styles.logoContent}>
            <img src={SpokeIcon} />
            <div>spoke</div>
          </Link>
        </div>
        <div className={styles.toolbtns}>{this.renderToolButtons(toolButtons)}</div>
        <div className={styles.tooltoggles}>
          <ToolToggle
            text={spaceToggle.text}
            key={spaceToggle.name}
            name={spaceToggle.name}
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
            key={snapToggle.name}
            name={snapToggle.name}
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
        <Button className={styles.publishButton} onClick={this.props.onPublish}>
          Publish to Hubs...
        </Button>
        <ContextMenu id="menu">
          {this.props.menu.map(menu => {
            return this.renderMenu(menu);
          })}
        </ContextMenu>
      </div>
    );
  }
}
