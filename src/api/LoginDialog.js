import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../ui/dialogs/dialog.scss";
import DialogHeader from "../ui/dialogs/DialogHeader";
import AuthContainer from "./AuthContainer";
import Button from "../ui/inputs/Button";

export default class LoginDialog extends Component {
  static propTypes = {
    hideDialog: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  };

  render() {
    return (
      <div className={styles.dialogContainer}>
        <DialogHeader title="Login" />
        <div className={styles.loginContainer}>
          <AuthContainer onSuccess={this.props.onSuccess} />
          <Button key="cancel" onClick={this.props.hideDialog} className={styles.cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }
}
