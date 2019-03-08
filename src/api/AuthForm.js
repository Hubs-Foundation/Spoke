import React, { Component } from "react";
import PropTypes from "prop-types";

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
    console.log("onsubmit");
    this.props.onSubmit(this.state.email);
  };

  onEmailChange = e => {
    this.setState({ email: e.target.value });
  };

  render() {
    return (
      <form onSubmit={this.onSubmit}>
        {this.props.error && <p>{this.props.error}</p>}
        <label>
          Email:
          <input type="email" placeholder="Your email address" value={this.state.email} onChange={this.onEmailChange} />
        </label>
        <p>
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
        <button type="submit">next</button>
      </form>
    );
  }
}
