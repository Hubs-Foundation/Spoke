import React, { Component } from "react";
import PropTypes from "prop-types";

import AuthEmailSentMessage from "./AuthEmailSentMessage";
import AuthForm from "./AuthForm";

export default class AuthContainer extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired
  };

  state = {
    error: null,
    emailSent: false,
    redirectToReferrer: false
  };

  onSubmit = email => {
    this.props.api
      .authenticate(email)
      .then(this.props.onSuccess)
      .catch(this.onError);
  };

  onError = err => {
    this.setState({ error: err.message || "Error signing in. Please try again." });
  };

  render() {
    if (this.state.mailSent) {
      return <AuthEmailSentMessage />;
    }

    return <AuthForm error={this.state.error} onSubmit={this.onSubmit} />;
  }
}
