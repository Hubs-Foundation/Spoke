import React, { Component } from "react";
import PropTypes from "prop-types";
import ToolButton from "./ToolButton";
import ToolToggle from "./ToolToggle";
import { showMenu, ContextMenu, MenuItem, SubMenu } from "react-contextmenu";
import styles from "./ToolBar.scss";
import SnappingDropdown from "./SnappingDropdown";

export default class ToolBar extends Component {
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
      toolToggles: [
        {
          name: "coordination",
          type: "toggle",
          text: ["Global", "Local"],
          isSwitch: true,
          icons: {
            checked: "fa-cube",
            unchecked: "fa-globe"
          },
          action: status => this.onCoordinationChanged(status)
        },
        {
          name: "snap",
          type: "toggle",
          text: ["Snapping", "Snapping"],
          children: <SnappingDropdown />,
          isSwitch: false,
          icons: {
            checked: "fa-magnet",
            unchecked: "fa-magnet"
          },
          action: status => this.onSnappingChanged(status)
        }
      ],
      toolButtonSelected: "translate"
    };
    props.editor.signals.transformModeChanged.add(mode => {
      this._updateToolBarStatus(mode);
    });
  }

  _updateToolBarStatus = selectedBtnName => {
    this.setState({
      toolButtonSelected: selectedBtnName
    });
  };

  onMenuSelected = e => {
    const x = e.currentTarget.offsetWidth / 2;
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

  onCoordinationChanged = newStatus => {
    if (newStatus) {
      // toggle true means we are switching to local
      this.props.editor.signals.spaceChanged.dispatch("local");
    } else {
      this.props.editor.signals.spaceChanged.dispatch("world");
    }
  };

  onSnappingChanged = newStatus => {
    this.props.editor.signals.snapToggled.dispatch(newStatus);
  };

  renderToolButtons = buttons => {
    return buttons.map(btn => {
      const { onClick, name, type } = btn;
      const selected = btn.name === this.state.toolButtonSelected;
      return <ToolButton toolType={type} key={type} onClick={onClick} selected={selected} id={name} />;
    });
  };

  renderToolToggles = toggles => {
    return toggles.map(toggle => {
      const { name, text, action, icons, isSwitch, children } = toggle;
      return (
        <ToolToggle
          text={text}
          key={name}
          name={name}
          action={action}
          icons={icons}
          isSwitch={isSwitch}
          editor={this.props.editor}
        >
          {children}
        </ToolToggle>
      );
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
        <SubMenu key={menu.name} title={menu.name}>
          {menu.items.map(item => {
            return this.renderMenus(item);
          })}
        </SubMenu>
      );
    }
  };

  render() {
    const { toolButtons, toolToggles } = this.state;
    return (
      <div className={styles.toolbar}>
        <div className={styles.toolbtns}>{this.renderToolButtons(toolButtons)}</div>
        <div className={styles.tooltoggles}>{this.renderToolToggles(toolToggles)}</div>
        <ContextMenu id="menu">
          {this.props.menus.map(menu => {
            return this.renderMenus(menu);
          })}
        </ContextMenu>
      </div>
    );
  }
}

ToolBar.propTypes = {
  menus: PropTypes.array,
  editor: PropTypes.object
};
