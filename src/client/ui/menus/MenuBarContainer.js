import React, { Component } from "react";
import PropTypes from "prop-types";
import MenuBar from "./MenuBar";

export default class MenuBarContainer extends Component {
  static propTypes = {
    menus: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
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

    this.menuBarRef = React.createRef();
  }

  onClickMenuItem = (e, menuItem) => {
    document.body.removeEventListener("click", this.onClickBody, false);
    this.setState({
      openMenu: null
    });

    if (menuItem.action) {
      menuItem.action(e, menuItem);
    }
  };

  onClickMenu = (e, menu) => {
    if (this.state.openMenu === null) {
      document.body.addEventListener("click", this.onClickBody, false);
      this.setState({
        openMenu: menu.name
      });
    }
  };

  onClickBody = e => {
    if (this.state.openMenu !== null && !this.menuBarRef.current.contains(e.target)) {
      document.body.removeEventListener("click", this.onClickBody, false);
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

  render() {
    const menus = this.props.menus.map(menu => ({
      name: menu.name,
      open: this.state.openMenu === menu.name,
      items: menu.items
        ? menu.items.map(menuItem => ({
            name: menuItem.name,
            onClick: e => this.onClickMenuItem(e, menuItem)
          }))
        : [],
      onMouseOver: e => this.onMouseOverMenu(e, menu),
      onClick: e => this.onClickMenu(e, menu)
    }));

    return <MenuBar ref={this.menuBarRef} menus={menus} />;
  }
}
