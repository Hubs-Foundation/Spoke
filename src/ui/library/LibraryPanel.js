import React, { Component } from "react";
import styles from "./LibraryPanel.scss";
import PropTypes from "prop-types";

export default class LibraryPanel extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return <div className={styles.libraryPanel}>{this.props.children}</div>;
  }
}
