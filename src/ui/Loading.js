import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Loading.scss";
import SpokeLogo from "./SpokeLogo";

export default class Loading extends Component {
  static propTypes = {
    message: PropTypes.string,
    fullScreen: PropTypes.bool
  };

  render() {
    return (
      <div className={classNames(styles.loading, { [styles.fullScreen]: this.props.fullScreen })}>
        <SpokeLogo />
        {this.props.message}
      </div>
    );
  }
}
