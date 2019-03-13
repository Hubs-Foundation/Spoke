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
    email: null,
    redirectToReferrer: false
  };

  onSubmit = email => {
    if (email.trim().length === 0) {
      return;
    }

    this.props.api
      .authenticate(email)
      .then(this.props.onSuccess)
      .catch(this.onError);

    this.setState({ mailSent: true, email });
  };

  onError = err => {
    this.setState({ mailSent: false, email: null, error: err.message || "Error signing in. Please try again." });
  };

  render() {
    if (this.state.mailSent) {
      return <AuthEmailSentMessage email={this.state.email} />;
    }

    return <AuthForm error={this.state.error} onSubmit={this.onSubmit} />;
  }
}
