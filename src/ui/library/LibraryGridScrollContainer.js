import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryGridScrollContainer.scss";

export default class LibraryGridScrollContainer extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return <div className={styles.libraryGridScrollContainer}>{this.props.children}</div>;
  }
}
