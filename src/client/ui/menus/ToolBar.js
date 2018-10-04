import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { showMenu, ContextMenu, MenuItem, SubMenu } from "react-contextmenu";

import ToolButton from "./ToolButton";
import Button from "../Button";
import ToolToggle from "./ToolToggle";
import styles from "./ToolBar.scss";
import SnappingDropdown from "./SnappingDropdown";

export default class ToolBar extends Component {
  static propTypes = {
    menus: PropTypes.array,
    editor: PropTypes.object,
    sceneActions: PropTypes.object
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
        name: "coordination",
        type: "toggle",
        text: ["Global", "Local"],
        isSwitch: true,
        isChecked: false,
        icons: {
          checked: "fa-cube",
          unchecked: "fa-globe"
        },
        action: () => this.onCoordinationChanged()
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
      toolButtonSelected: "translate",
      updateNotificationDismissed: false
    };
    props.editor.signals.transformModeChanged.add(mode => {
      this._updateToolBarStatus(mode);
    });

    props.editor.signals.spaceChanged.add(() => {
      this._updateToggle(this.state.spaceToggle);
    });

    props.editor.signals.snapToggled.add(() => {
      this._updateToggle(this.state.snapToggle);
    });
  }

  _updateToggle = toggle => {
    const current = toggle;
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
    this.props.editor.signals.transformModeChanged.dispatch("translate");
  };

  onRotateSelected = () => {
    this.props.editor.signals.transformModeChanged.dispatch("rotate");
  };

  onScaleSelected = () => {
    this.props.editor.signals.transformModeChanged.dispatch("scale");
  };

  onCoordinationChanged = () => {
    this.props.editor.signals.spaceChanged.dispatch();
  };

  onSnappingChanged = () => {
    this.props.editor.signals.snapToggled.dispatch();
  };

  renderToolButtons = buttons => {
    return buttons.map(btn => {
      const { onClick, name, type } = btn;
      const selected = btn.name === this.state.toolButtonSelected;
      return <ToolButton toolType={type} key={type} onClick={onClick} selected={selected} id={name} />;
    });
  };

  renderMenus = menu => {
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
            return this.renderMenus(item);
          })}
        </SubMenu>
      );
    }
  };

  render() {
    const { toolButtons, spaceToggle, snapToggle } = this.state;
    const { updateAvailable, updateRequired, latestVersion, downloadUrl } = this.props.editor.updateInfo;
    const showUpdateNotification = updateAvailable && !updateRequired && !this.state.updateNotificationDismissed;
    return (
      <div className={styles.toolbar}>
        <div className={styles.logo}>spoke</div>
        {showUpdateNotification && (
          <div className={styles.notification}>
            <div className={styles.message}>
              {`Spoke ${latestVersion} is available. `}
              <Button className={styles.download} href={downloadUrl}>
                Download
              </Button>
            </div>
            <i
              className={classNames(styles.dismiss, "fa fa-times fa-12px")}
              onClick={() => this.setState({ updateNotificationDismissed: true })}
            />
          </div>
        )}
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
        <Button className={styles.publishButton} onClick={this.props.sceneActions.onPublishScene}>
          Publish to Hubs...
        </Button>
        <ContextMenu id="menu">
          {this.props.menus.map(menu => {
            return this.renderMenus(menu);
          })}
        </ContextMenu>
      </div>
    );
  }
}
