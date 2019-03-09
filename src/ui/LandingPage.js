import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { withApi } from "./contexts/ApiContext";

class LandingPage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired
  };

  render() {
    return (
      <div>
        <h1>Spoke</h1>
        {this.props.api.isAuthenticated() ? (
          <div>
            <Link to="/projects">Projects</Link>
            <Link to="/logout">Logout</Link>
          </div>
        ) : (
          <div>
            <Link to="/login">Login</Link>
          </div>
        )}
      </div>
    );
  }
}

export default withApi(LandingPage);
