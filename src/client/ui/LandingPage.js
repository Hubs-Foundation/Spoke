import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export default class LandingPage extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
  };

  render() {
    return (
      <div>
        <h1>Spoke</h1>
        <Link to="/projects">Projects</Link>
      </div>
    );
  }
}
