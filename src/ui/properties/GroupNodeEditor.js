import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";

export default class GroupNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-cubes";

  render() {
    return (
      <NodeEditor
        {...this.props}
        description="A group of multiple objects that can be moved or duplicated together.\nDrag and drop objects into the Group in the Hierarchy."
      />
    );
  }
}
