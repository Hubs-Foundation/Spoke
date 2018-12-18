import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import { ImageProjection } from "../../editor/objects/Image";

const imageProjectionOptions = Object.values(ImageProjection).map(v => ({ label: v, value: v }));

export default class ImageNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-image";

  onChangeProjection = value => {
    this.props.editor.setNodeProperty(this.props.node, "projection", value);
  };

  render() {
    const { node } = this.props;
    return (
      <NodeEditor description="Dynamically loads an image." {...this.props}>
        <InputGroup name="Projection">
          <SelectInput options={imageProjectionOptions} value={node.projection} onChange={this.onChangeProjection} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
