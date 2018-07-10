import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./MenuBarContainer.scss";

export function MenuItem(props) {
  return (
    <div className={styles.menuItem} onClick={props.onClick}>
      {props.name}
    </div>
  );
}

MenuItem.propTypes = {
  name: PropTypes.string,
  onClick: PropTypes.func
};

export function Menu(props) {
  return (
    <div className={styles.menu} onMouseOver={props.onMouseOver} onClick={props.onClick}>
      {props.name}
      {props.open && (
        <div className={styles.dropdown}>
          {props.items.map(item => {
            return <MenuItem key={item.name} {...item} />;
          })}
        </div>
      )}
    </div>
  );
}

Menu.propTypes = {
  name: PropTypes.string,
  open: PropTypes.bool,
  items: PropTypes.arrayOf(MenuItem.propTypes),
  onMouseOver: PropTypes.func,
  onClick: PropTypes.func
};

export function MenuBar(props) {
  return (
    <div className={styles.menuBar}>
      {props.menus.map(menu => {
        return <Menu key={menu.name} {...menu} />;
      })}
    </div>
  );
}

MenuBar.propTypes = {
  menus: PropTypes.arrayOf(Menu.propTypes)
};

export default class MenuBarContainer extends Component {
  static propTypes = {
    menus: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.name,
            action: PropTypes.func
          })
        )
      })
    )
  };

  static defaultProps = {
    menus: []
  };

  constructor(props) {
    super(props);

    this.state = {
      openMenu: null
    };
  }

  onClickMenuItem = (e, menuItem) => {
    document.body.removeEventListener("click", this.onClickBody);
    this.setState({
      openMenu: null
    });

    menuItem.action(e, menuItem);
  };

  onClickMenu = (e, menu) => {
    if (this.state.openMenu === null) {
      document.body.addEventListener("click", this.onClickBody);
      this.setState({
        openMenu: menu.name
      });
    }
  };

  onClickBody = () => {
    if (this.state.openMenu !== null) {
      document.body.removeEventListener("click", this.onClickBody);
      this.setState({
        openMenu: null
      });
    }
  };

  onMouseOverMenu = (e, menu) => {
    if (this.state.openMenu !== null) {
      this.setState({
        openMenu: menu.name
      });
    }
  };

  buildMenu = menu => {
    return {
      name: menu.name,
      open: this.state.openMenu === menu.name,
      items: menu.items ? menu.items.map(this.buildMenuItem) : [],
      onMouseOver: e => this.onMouseOver(e, menu),
      onClick: e => this.onClickMenu(e, menu)
    };
  };

  buildMenuItem = menuItem => {
    return {
      name: menuItem.name,
      onClick: e => this.onClickMenuItem(e, menuItem)
    };
  };

  render() {
    const menus = this.props.menus.map(this.buildMenu);
    return <MenuBar menus={menus} />;
  }
}
