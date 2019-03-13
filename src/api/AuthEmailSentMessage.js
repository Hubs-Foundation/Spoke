import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./AuthEmailSentMessage.scss";
import ProgressBar from "../ui/inputs/ProgressBar";

export default class AuthEmailSentMessage extends Component {
  static propTypes = {
    email: PropTypes.string.isRequired
  };

  render() {
    return (
      <div className={styles.authEmailSentMessage}>
        <h2>Email sent!</h2>
        <p>Waiting for you to click on the link sent to {this.props.email}</p>
        <ProgressBar />
      </div>
    );
  }
}
