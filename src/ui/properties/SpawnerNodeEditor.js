import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class SpawnerNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-magic";

  static description = "Spawns a model as an interactable object.";

  render() {
    return <NodeEditor {...this.props} description={SpawnerNodeEditor.description} />;
  }
}
