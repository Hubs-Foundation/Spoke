import React, { Component } from "react";
import { Route, Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "../contexts/ApiContext";

class AuthenticatedRoute extends Component {
  static propTypes = {
    component: PropTypes.elementType,
    render: PropTypes.func,
    api: PropTypes.object.isRequired
  };

  render() {
    const { component: Component, render, ...rest } = this.props;

    return (
      <Route
        {...rest}
        render={props =>
          this.props.api.isAuthenticated() ? (
            render ? (
              render(props)
            ) : (
              <Component {...props} />
            )
          ) : (
            <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
          )
        }
      />
    );
  }
}

export default withApi(AuthenticatedRoute);
