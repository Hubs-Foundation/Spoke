import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import { HandPaper } from "styled-icons/fa-solid/HandPaper";

export default class BoxColliderNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = HandPaper;

  static description =
    "An invisible box that objects will bounce off of or rest on top of.\nWithout colliders, objects will fall through floors and go through walls.";

  onChangeWalkable = walkable => {
    this.props.editor.setPropertySelected("walkable", walkable);
  };

  render() {
    return (
      <NodeEditor {...this.props} description={BoxColliderNodeEditor.description}>
        <InputGroup name="Walkable">
          <BooleanInput value={this.props.node.walkable} onChange={this.onChangeWalkable} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
