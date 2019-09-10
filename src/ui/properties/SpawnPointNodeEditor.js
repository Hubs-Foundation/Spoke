import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { StreetView } from "styled-icons/fa-solid/StreetView";

export default class SpawnPointNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = StreetView;

  static description =
    "A point where people will appear when they enter your scene.\nThe icon in the Viewport represents the actual size of an avatar.";

  render() {
    return <NodeEditor description={SpawnPointNodeEditor.description} {...this.props} />;
  }
}
