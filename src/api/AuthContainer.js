import React, { Component } from "react";
import PropTypes from "prop-types";
import { withApi } from "../ui/contexts/ApiContext";

import AuthEmailSentMessage from "./AuthEmailSentMessage";
import AuthForm from "./AuthForm";

class AuthContainer extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired
  };

  state = {
    error: null,
    emailSent: false,
    email: null
  };

  onSubmit = email => {
    if (email.trim().length === 0) {
      return;
    }

    this.props.api
      .authenticate(email)
      .then(this.props.onSuccess)
      .catch(this.onError);

    this.setState({ emailSent: true, email });
  };

  onError = err => {
    this.setState({ emailSent: false, email: null, error: err.message || "Error signing in. Please try again." });
  };

  render() {
    if (this.state.emailSent) {
      return <AuthEmailSentMessage email={this.state.email} />;
    }

    return <AuthForm error={this.state.error} onSubmit={this.onSubmit} />;
  }
}

export default withApi(AuthContainer);
