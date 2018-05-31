import React, { Component } from "react";
import PropTypes from "prop-types";
import Panel from "../components/Panel";

export default class HierarchyPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.array
  };

  render() {
    return <Panel title="Hierarchy" path={this.props.path} />;
  }
}
