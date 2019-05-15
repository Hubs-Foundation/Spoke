import React from "react";
import PropTypes from "prop-types";
import { Route, Redirect } from "react-router-dom";

export default function RedirectRoute({ to, ...rest }) {
  return <Route {...rest} render={() => <Redirect to={to} />} />;
}

RedirectRoute.propTypes = {
  to: PropTypes.any
};
