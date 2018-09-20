import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";
import StringInput from "../inputs/StringInput";
import BotImageUrl from "../../assets/LoginBot.png";
import classNames from "classnames";

export default class LoginDialog extends Component {
  static propTypes = {
    authStarted: PropTypes.bool,
    hideDialog: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    onLogin: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      email: ""
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.onLogin(this.state.email);
  };

  render() {
    const { authStarted, onCancel, hideDialog } = this.props;
    return (
      <div className={styles.dialogContainer}>
        <Header title="Publish to Hubs" />
        <div className={styles.loginContainer}>
          {authStarted ? (
            <div className={classNames([styles.content, styles.contentFullHeight])}>
              <div className={classNames([styles.contentRows, styles.contentRowsCentered])}>
                <div className={styles.message}>
                  {"Email sent!\nKeep this dialog open and click the link in the email to continue."}
                </div>
              </div>
            </div>
          ) : (
            <form id="login" onSubmit={this.handleSubmit}>
              <div className={styles.content}>
                <div className={classNames([styles.contentRows, styles.contentRowsCentered])}>
                  <img className={styles.topImage} src={BotImageUrl} />
                  <div className={styles.message}>{"Enter your email address to publish your scene to Hubs."}</div>
                  <div className={styles.message}>
                    By proceeding, you agree to the Hubs{" "}
                    <a
                      href="https://github.com/mozilla/hubs/blob/master/TERMS.md"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms of Use
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Notice
                    </a>.
                  </div>
                </div>
              </div>
              <div className={styles.content}>
                <div className={classNames([styles.contentRows, styles.contentRowsCentered])}>
                  <StringInput
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    required
                    value={this.state.email}
                    style={{ width: "200px" }}
                    onChange={email => this.setState({ email })}
                  />
                </div>
              </div>
            </form>
          )}
        </div>
        <div className={styles.bottom}>
          <Button key="cancel" onClick={onCancel || hideDialog} className={styles.cancel}>
            Cancel
          </Button>
          {!authStarted && (
            <Button key="login" form="login">
              Next
            </Button>
          )}
        </div>
      </div>
    );
  }
}
