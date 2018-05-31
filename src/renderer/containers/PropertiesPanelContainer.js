import React, { Component } from "react";
import PropTypes from "prop-types";
import Panel from "../components/Panel";

export default class PropertiesPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.array
  };

  render() {
    return <Panel title="Properties" path={this.props.path} />;
  }
}
