import React, { Component } from "react";
import PropTypes from "prop-types";
import Panel from "../components/Panel";

export default class AssetExplorerPanelContainer extends Component {
  static propTypes = {
    path: PropTypes.object
  };

  render() {
    return <Panel title="Asset Explorer" path={this.props.path} />;
  }
}
