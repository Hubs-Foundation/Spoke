import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../ui/dialogs/dialog.scss";
import DialogHeader from "../ui/dialogs/DialogHeader";
import AuthContainer from "./AuthContainer";

export default class LoginDialog extends Component {
  static propTypes = {
    onSuccess: PropTypes.func.isRequired
  };

  render() {
    return (
      <div className={styles.dialogContainer}>
        <DialogHeader title="Publish to Hubs" />
        <div className={styles.loginContainer}>
          <AuthContainer onSuccess={this.props.onSuccess} />
        </div>
      </div>
    );
  }
}
