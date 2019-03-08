import React, { Component } from "react";
import { Link } from "react-router-dom";

export default class LandingPage extends Component {
  render() {
    return (
      <div>
        <h1>Spoke</h1>
        <Link to="/projects">Projects</Link>
      </div>
    );
  }
}
