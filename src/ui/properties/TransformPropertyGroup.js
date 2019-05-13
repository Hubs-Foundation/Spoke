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
    this.props.editor.signals.propertyChanged.add(this.onPropertyChanged);
    this.props.editor.signals.objectChanged.add(this.onObjectChanged);
  }

  componentWillUnmount() {
    this.props.editor.signals.propertyChanged.remove(this.onPropertyChanged);
    this.props.editor.signals.objectChanged.remove(this.onObjectChanged);
  }

  onPropertyChanged = (property, object) => {
    if (object === this.props.node && (property === "position" || property === "rotation" || property === "scale")) {
      this.forceUpdate();
    }
  };

  onObjectChanged = () => {
    this.forceUpdate();
  };

  onChangePosition = value => {
    this.props.editor.setNodeProperty(this.props.node, "position", value);
  };

  onChangeRotation = value => {
    this.props.editor.setNodeProperty(this.props.node, "rotation", value);
  };

  onChangeScale = value => {
    this.props.editor.setNodeProperty(this.props.node, "scale", value);
  };

  render() {
    const { node } = this.props;

    return (
      <PropertyGroup name="Transform">
        <InputGroup name="Position">
          <Vector3Input value={node.position} onChange={this.onChangePosition} />
        </InputGroup>
        <InputGroup name="Rotation">
          <EulerInput value={node.rotation} onChange={this.onChangeRotation} unit="°" />
        </InputGroup>
        <InputGroup name="Scale">
          <Vector3Input uniformScaling value={node.scale} onChange={this.onChangeScale} />
        </InputGroup>
      </PropertyGroup>
    );
  }
}
