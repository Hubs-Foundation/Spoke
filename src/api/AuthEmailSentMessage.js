import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./AuthEmailSentMessage.scss";
import ProgressBar from "../ui/inputs/ProgressBar";

export default class AuthEmailSentMessage extends Component {
  static propTypes = {
    email: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  onCancel = e => {
    e.preventDefault();
    this.props.onCancel();
  };

  render() {
    return (
      <div className={styles.authEmailSentMessage}>
        <h2>Email sent!</h2>
        <p>Waiting for you to click on the link sent to {this.props.email}</p>
        <strong>Don&#39;t close this browser tab or you may lose your work!</strong>
        <ProgressBar />
        <div>
          <a href="#" onClick={this.onCancel}>
            Cancel
          </a>
        </div>
      </div>
    );
  }
}
