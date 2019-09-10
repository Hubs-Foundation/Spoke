import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Cubes } from "styled-icons/fa-solid/Cubes";

export default class GroupNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Cubes;

  static description =
    "A group of multiple objects that can be moved or duplicated together.\nDrag and drop objects into the Group in the Hierarchy.";

  render() {
    return <NodeEditor {...this.props} description={GroupNodeEditor.description} />;
  }
}
