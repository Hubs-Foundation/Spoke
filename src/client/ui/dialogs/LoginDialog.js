import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";
import StringInput from "../inputs/StringInput";

export default class LoginDialog extends Component {
  static propTypes = {
    onLogin: PropTypes.func,
    authStarted: PropTypes.bool,
    onCancel: PropTypes.func,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      email: ""
    };
  }

  render() {
    const { onLogin, authStarted, onCancel, hideDialog } = this.props;
    return (
      <div className={styles.dialogContainer}>
        <Header title="Log in to Publish" />
        <div className={styles.loginContainer}>
          {authStarted ? (
            <div className={styles.content}>
              <div className={styles.message}>Email sent! Please click on the link in th email to continue.</div>
            </div>
          ) : (
            <div>
              <div className={styles.content}>
                <div className={styles.message}>
                  Log in to publish your scene. You will be sent an email with a magic link.
                </div>
              </div>
              <div className={styles.content}>
                <label className={styles.label}>E-Mail Address:</label>
                <StringInput
                  id="email"
                  type="email"
                  required
                  value={this.state.email}
                  onChange={email => this.setState({ email })}
                />
              </div>
            </div>
          )}
        </div>
        <div className={styles.bottom}>
          <Button key="cancel" onClick={onCancel || hideDialog} className={styles.cancel}>
            Cancel
          </Button>
          {!authStarted && (
            <Button key="login" onClick={() => onLogin(this.state.email)}>
              Log in
            </Button>
          )}
        </div>
      </div>
    );
  }
}
