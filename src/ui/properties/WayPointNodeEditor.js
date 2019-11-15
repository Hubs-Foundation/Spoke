import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { StreetView } from "styled-icons/fa-solid/StreetView";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";

export default class WayPointNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = StreetView;

  static description = "A point people can teleport to.\n";

  constructor(props) {
    super(props);
    const createPropSetter = propName => value => {
      return this.props.editor.setPropertySelected(propName, value);
    };
    this.onChangeCanBeSpawnPoint = createPropSetter("canBeSpawnPoint");
    this.onChangeCanBeOccupied = createPropSetter("canBeOccupied");
    this.onChangeCanBeClicked = createPropSetter("canBeClicked");
    this.onChangeWillDisableMotion = createPropSetter("willDisableMotion");
  }

  render() {
    const { node } = this.props;
    return (
      <NodeEditor description={WayPointNodeEditor.description} {...this.props}>
        <InputGroup name="Spawn Point">
          <BooleanInput value={node.canBeSpawnPoint} onChange={this.onChangeCanBeSpawnPoint} />
        </InputGroup>
        <InputGroup name="Occupiable">
          <BooleanInput value={node.canBeOccupied} onChange={this.onChangeCanBeOccupied} />
        </InputGroup>
        <InputGroup name="Clickable">
          <BooleanInput value={node.canBeClicked} onChange={this.onChangeCanBeClicked} />
        </InputGroup>
        <InputGroup name="Will Temporarily Disable Motion">
          <BooleanInput value={node.willDisableMotion} onChange={this.onChangeWillDisableMotion} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
