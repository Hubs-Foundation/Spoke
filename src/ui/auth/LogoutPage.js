import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";

class LogoutPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired
  };

  componentDidMount() {
    this.props.api.logout();
  }

  render() {
    return <Redirect to="/" />;
  }
}

export default withApi(LogoutPage);
