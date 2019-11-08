import React, { Component } from "react";
import { Vector3 } from "three";
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
    this.translation = new Vector3();
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
    for (let i = 0; i < objects.length; i++) {
      if (
        objects[i] === this.props.node &&
        (property === "position" ||
          property === "rotation" ||
          property === "scale" ||
          property === "matrix" ||
          property == null)
      ) {
        this.forceUpdate();
        return;
      }
    }
  };

  onChangePosition = value => {
    this.translation.subVectors(value, this.props.node.position);
    this.props.editor.translateSelected(this.translation);
  };

  onChangeRotation = value => {
    this.props.editor.setRotationSelected(value);
  };

  onChangeScale = value => {
    this.props.editor.setScaleSelected(value);
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
