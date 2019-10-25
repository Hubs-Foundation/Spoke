import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import { ImageProjection } from "../../editor/objects/Image";
import ImageInput from "../inputs/ImageInput";
import { Image } from "styled-icons/fa-solid/Image";

const imageProjectionOptions = Object.values(ImageProjection).map(v => ({ label: v, value: v }));

export default class ImageNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Image;

  static description = "Dynamically loads an image.";

  onChangeSrc = src => {
    this.props.editor.setPropertySelected("src", src);
  };

  onChangeProjection = value => {
    this.props.editor.setPropertySelected("projection", value);
  };

  render() {
    const { node } = this.props;
    return (
      <NodeEditor description={ImageNodeEditor.description} {...this.props}>
        <InputGroup name="Image">
          <ImageInput value={node.src} onChange={this.onChangeSrc} />
        </InputGroup>
        <InputGroup name="Projection">
          <SelectInput options={imageProjectionOptions} value={node.projection} onChange={this.onChangeProjection} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
