import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./Loading.scss";
import SpokeLogo from "./SpokeLogo";

export default class Loading extends Component {
  static propTypes = {
    message: PropTypes.string
  };

  render() {
    return (
      <div className={styles.loading}>
        <SpokeLogo />
        {this.props.message}
      </div>
    );
  }
}
