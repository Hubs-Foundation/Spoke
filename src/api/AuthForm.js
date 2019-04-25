import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./AuthForm.scss";

export default class AuthForm extends Component {
  static propTypes = {
    error: PropTypes.string,
    onSubmit: PropTypes.func.isRequired
  };

  state = {
    email: ""
  };

  onSubmit = e => {
    e.preventDefault();
    this.props.onSubmit(this.state.email);
  };

  onEmailChange = e => {
    this.setState({ email: e.target.value });
  };

  render() {
    return (
      <form className={styles.authForm} onSubmit={this.onSubmit}>
        {this.props.error && <p className={styles.error}>{this.props.error}</p>}
        <h3>Register or Login</h3>
        <h4>Login to save projects and publish scenes to Hubs.</h4>
        <input type="email" placeholder="Email" value={this.state.email} onChange={this.onEmailChange} />
        <p className={styles.legalText}>
          By proceeding, you agree to the{" "}
          <a rel="noopener noreferrer" target="_blank" href="https://github.com/mozilla/hubs/blob/master/TERMS.md">
            terms of use
          </a>{" "}
          and{" "}
          <a rel="noopener noreferrer" target="_blank" href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md">
            privacy notice
          </a>
          .
        </p>
        <button type="submit">Send Magic Link</button>
      </form>
    );
  }
}
