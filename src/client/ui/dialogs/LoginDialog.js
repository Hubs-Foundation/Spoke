import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";
import StringInput from "../inputs/StringInput";

export default class LoginDialog extends Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      email: ""
    };
  }

  render() {
    const { onLogin, hideDialog } = this.props;
    return (
      <div className={styles.dialogContainer}>
        <Header title="Login to publish" />
        <div className={styles.loginContainer}>
          <div className={styles.content}>
            <div className={styles.message}>
              Login to publish your scene. You will be sent an email with a magic link.
            </div>
          </div>
          <div className={styles.content}>
            <label className={styles.label}>E-Mail Address:</label>
            <StringInput type="email" required value={this.state.email} onChange={email => this.setState({ email })} />
          </div>
        </div>
        <div className={styles.bottom}>
          <Button key="cancel" onClick={hideDialog} className={styles.cancel}>
            Cancel
          </Button>
          <Button key="login" onClick={() => onLogin(this.state.email)}>
            Login
          </Button>
        </div>
      </div>
    );
  }
}
