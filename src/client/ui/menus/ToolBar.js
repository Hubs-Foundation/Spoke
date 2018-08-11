import React, { Component } from "react";
import PropTypes from "prop-types";
import ToolButton from "./ToolButton";
import { showMenu, ContextMenu, MenuItem, SubMenu } from "react-contextmenu";
import styles from "./ToolBar.scss";

const toolTypesMap = new Map([
  ["menu", "fa-bars"],
  ["selection", "fa-mouse-pointer"],
  ["move", "fa-arrows-alt"],
  ["rotate", "fa-sync-alt"],
  ["scale", "fa-arrows-alt-v"]
]);

export default class ToolBar extends Component {
  constructor(props) {
    super(props);
  }

  toolBtnOnClick = e => {
    e.persist();
    console.log(e.target);
    const x = e.clientX;
    const y = e.target.offsetHeight;
    showMenu({
      position: { x, y },
      target: e.target,
      id: "menu"
    });
  };

  renderToolButtons = () => {
    return this.props.toolButtons.map(btn => {
      const type = toolTypesMap.get(btn.name);
      const { onClick, selected } = btn;
      return <ToolButton toolType={type} key={type} onClick={onClick} selected={selected} />;
    });
  };

  renderToolToggles = () => {
    console.log(`toggls`);
    //const toggleAttributes = this.props.toggleAttributes;
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
    return (
      <div className={styles.toolbar}>
        <div className={styles.toolbtns}>{this.renderToolButtons()}</div>
        <div id="tooltoggles">{this.renderToolToggles()}</div>
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
  toolButtons: PropTypes.array
};
