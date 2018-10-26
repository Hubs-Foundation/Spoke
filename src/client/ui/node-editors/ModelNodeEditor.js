import React, { Component } from "react";
import PropTypes from "prop-types";
import PropertyGroup from "../../ui/PropertyGroup";
import InputGroup from "../../ui/InputGroup";
import FileInput from "../../ui/inputs/FileInput";

export default class ModelNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    object3D: PropTypes.object
  };

  onChangeSrc = src => {
    this.props.object3D.loadGLTF(this.props.editor, src);
  };

  render() {
    const { object3D } = this.props;

    return (
      <PropertyGroup name="Model">
        <InputGroup name="src">
          <FileInput value={object3D.src} onChange={this.onChangeSrc} />
        </InputGroup>
      </PropertyGroup>
    );
  }
}
