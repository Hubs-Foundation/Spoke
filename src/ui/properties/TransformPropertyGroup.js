import React, { Component } from "react";
import PropTypes from "prop-types";
import PropertyGroup from "./PropertyGroup";
import InputGroup from "../inputs/InputGroup";
import Vector3Input from "../inputs/Vector3Input";
import EulerInput from "../inputs/EulerInput";

export default class TransformPropertyGroup extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.node !== this.props.node;
  }

  componentDidMount() {
    this.props.editor.addListener("objectsChanged", this.onObjectsChanged);
  }

  componentWillUnmount() {
    this.props.editor.removeListener("objectsChanged", this.onObjectsChanged);
  }

  onObjectsChanged = (objects, property) => {
    if (
      objects[0] === this.props.node &&
      (property === "position" ||
        property === "rotation" ||
        property === "scale" ||
        property === "matrix" ||
        property == null)
    ) {
      this.forceUpdate();
    }
  };

  onChangePosition = value => {
    this.props.editor.setPosition(this.props.node, value);
  };

  onChangeRotation = value => {
    this.props.editor.setRotation(this.props.node, value);
  };

  onChangeScale = value => {
    this.props.editor.setScale(this.props.node, value);
  };

  render() {
    const { node } = this.props;

    return (
      <PropertyGroup name="Transform">
        <InputGroup name="Position">
          <Vector3Input
            value={node.position}
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={1}
            onChange={this.onChangePosition}
          />
        </InputGroup>
        <InputGroup name="Rotation">
          <EulerInput value={node.rotation} onChange={this.onChangeRotation} unit="°" />
        </InputGroup>
        <InputGroup name="Scale">
          <Vector3Input
            uniformScaling
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={1}
            value={node.scale}
            onChange={this.onChangeScale}
          />
        </InputGroup>
      </PropertyGroup>
    );
  }
}
