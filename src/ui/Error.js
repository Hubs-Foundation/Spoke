import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./Error.scss";
import SpokeLogo from "./SpokeLogo";
import { Link } from "react-router-dom";

export default class Error extends Component {
  static propTypes = {
    message: PropTypes.string
  };

  render() {
    return (
      <div className={styles.error}>
        <Link to="/">
          <SpokeLogo />
        </Link>
        {this.props.message}
      </div>
    );
  }
}
