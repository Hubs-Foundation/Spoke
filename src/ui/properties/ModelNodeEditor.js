import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import SelectInput from "../inputs/SelectInput";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import ModelInput from "../inputs/ModelInput";
import MaterialEditor from "./MaterialEditor";

export default class ModelNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconClassName = "fa-cube";

  static description = "A 3D model in your scene, loaded from a GLTF URL or file.";

  onChangeSrc = src => {
    this.props.editor.setNodeProperty(this.props.node, "src", src);
  };

  onChangeAnimation = activeClipName => {
    this.props.editor.setNodeProperty(this.props.node, "activeClipName", activeClipName);
  };

  onChangeCollidable = collidable => {
    this.props.editor.setNodeProperty(this.props.node, "collidable", collidable);
  };

  onChangeWalkable = walkable => {
    this.props.editor.setNodeProperty(this.props.node, "walkable", walkable);
  };

  onChangeCastShadow = castShadow => {
    this.props.editor.setNodeProperty(this.props.node, "castShadow", castShadow);
  };

  onChangeReceiveShadow = receiveShadow => {
    this.props.editor.setNodeProperty(this.props.node, "receiveShadow", receiveShadow);
  };

  render() {
    const node = this.props.node;
    const activeClipName = node.activeClipName;
    const clipOptions = node.getClipNames().map(name => ({ label: name, value: name }));
    clipOptions.unshift({ label: "None", value: null });
    const materials = node.getMaterials();

    return (
      <NodeEditor description={ModelNodeEditor.description} {...this.props}>
        <InputGroup name="Model">
          <ModelInput value={node.src} onChange={this.onChangeSrc} />
        </InputGroup>
        <InputGroup name="Materials">
          <div>
            {materials.map(material => (
              <MaterialEditor key={material.id} {...this.props} material={material} />
            ))}
          </div>
        </InputGroup>
        <InputGroup name="Loop Animation">
          <SelectInput options={clipOptions} value={activeClipName} onChange={this.onChangeAnimation} />
        </InputGroup>
        <InputGroup name="Collidable">
          <BooleanInput value={node.collidable} onChange={this.onChangeCollidable} />
        </InputGroup>
        <InputGroup name="Walkable">
          <BooleanInput value={node.walkable} onChange={this.onChangeWalkable} />
        </InputGroup>
        <InputGroup name="Cast Shadow">
          <BooleanInput value={node.castShadow} onChange={this.onChangeCastShadow} />
        </InputGroup>
        <InputGroup name="Receive Shadow">
          <BooleanInput value={node.receiveShadow} onChange={this.onChangeReceiveShadow} />
        </InputGroup>
      </NodeEditor>
    );
  }
}
