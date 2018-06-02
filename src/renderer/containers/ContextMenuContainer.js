import React, { Component } from "react";
import PropTypes from "prop-types";
import { buildContextMenu, showContextMenu, isNative } from "../api";

export default class ContextMenuContainer extends Component {
  static propTypes = {
    menuItems: PropTypes.array,
    children: PropTypes.element
  };

  constructor(props) {
    super(props);
    this.elRef = React.createRef();
  }

  componentDidMount() {
    if (isNative) {
      this.menu = buildContextMenu(this.props.menuItems);
    }

    this.elRef.current.addEventListener("contextmenu", this.onContextMenu, false);
  }

  onContextMenu = e => {
    e.preventDefault();

    if (isNative) {
      showContextMenu(this.menu);
    }
  };

  componentWillUnmount() {
    this.elRef.current.removeEventListener("contextmenu", this.onContextMenu, false);
  }

  render() {
    // eslint-disable-next-line
    const { children, menuItems, ...rest } = this.props;

    return (
      <div {...rest} ref={this.elRef}>
        {children}
      </div>
    );
  }
}
