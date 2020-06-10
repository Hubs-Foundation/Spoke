import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { StreetView } from "styled-icons/fa-solid/StreetView";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";

const messages = {
  "waypoint.label-canBeSpawnPoint": "Spawn Point",
  "waypoint.label-canBeOccupied": "Can be occupied",
  "waypoint.label-canBeClicked": "Clickable",
  "waypoint.label-willDisableMotion": "Disable Motion",
  "waypoint.label-willDisableTeleport": "Disable Teleporting",
  "waypoint.label-snapToNavMesh": "Snap to floor plan",
  "waypoint.label-willMaintainInitialOrientation": "Maintain initial orientation",
  "waypoint.description-canBeSpawnPoint": "Avatars may be teleported to this waypoint when entering the scene",
  "waypoint.description-canBeOccupied":
    "After each use, this waypoint will be disabled until the previous user moves away from it",
  "waypoint.description-canBeClicked":
    "This waypoint will be visible in pause mode and clicking on it will teleport you to it",
  "waypoint.description-willDisableMotion": "Avatars will not be able to move after using this waypoint",
  "waypoint.description-willDisableTeleport": "Avatars will not be able to teleport after using this waypoint",
  "waypoint.description-snapToNavMesh":
    "Avatars will move as close as they can to this waypoint but will not leave the ground",
  "waypoint.description-willMaintainInitialOrientation":
    "Instead of rotating to face the same direction as the waypoint, users will maintain the orientation they started with before they teleported"
};

const propertyNames = [
  "canBeSpawnPoint",
  "canBeOccupied",
  "canBeClicked",
  "willDisableMotion",
  "willDisableTeleport",
  "snapToNavMesh",
  "willMaintainInitialOrientation"
];

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
    this.setters = new Map(propertyNames.map(name => [name, createPropSetter(name)]));
  }

  render() {
    const { node } = this.props;
    return (
      <NodeEditor description={WayPointNodeEditor.description} {...this.props}>
        {propertyNames.map(name => (
          <InputGroup
            key={`${name}-input-group`}
            name={messages[`waypoint.label-${name}`]}
            info={messages[`waypoint.description-${name}`]}
          >
            <BooleanInput value={node[name]} onChange={this.setters.get(name)} />
          </InputGroup>
        ))}
      </NodeEditor>
    );
  }
}
