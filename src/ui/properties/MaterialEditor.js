import React, { Component } from "react";
import PropTypes from "prop-types";
import ColorInput from "../inputs/ColorInput";
import TextureInput from "../inputs/TextureInput";
import InputGroup from "../inputs/InputGroup";
import CompoundNumericInput from "../inputs/CompoundNumericInput";
import THREE from "../../vendor/three";

export default class MaterialEditor extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    material: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    const createPropSetter = propName => value =>
      this.props.editor.setNodeMaterialProperty(this.props.node, this.props.material, propName, value);
    this.onChangeColor = createPropSetter("color");
    this.onChangeMap = createPropSetter("map");
    this.onChangeEmissive = createPropSetter("emissive");
    this.onChangeEmissiveMap = createPropSetter("emissiveMap");
    this.onChangeMetalness = createPropSetter("metalness");
    this.onChangeMetalnessMap = createPropSetter("metalnessMap");
    this.onChangeRoughness = createPropSetter("roughness");
    this.onChangeRoughnessMap = createPropSetter("roughnessMap");
    this.tempNormalScale = new THREE.Vector2();
    this.onChangeNormalScale = value =>
      this.props.editor.setNodeMaterialProperty(
        this.props.node,
        this.props.material,
        "normalScale",
        this.tempNormalScale.set(value, value)
      );
    this.onChangeNormalMap = createPropSetter("normalMap");
    this.onChangeAOMapIntensity = createPropSetter("aoMapIntensity");
    this.onChangeAOMap = createPropSetter("aoMap");
  }

  render() {
    const material = this.props.material;

    return (
      <div key={material.id}>
        <div>{material.name}</div>
        <InputGroup name="Color">
          <ColorInput value={material.color} onChange={this.onChangeColor} />
        </InputGroup>
        <InputGroup name="Base Color Map">
          <TextureInput value={material.map} onChange={this.onChangeMap} />
        </InputGroup>
        {material.isMeshStandardMaterial && (
          <>
            <InputGroup name="Emissive Color">
              <ColorInput value={material.emissive} onChange={this.onChangeEmissive} />
            </InputGroup>
            <InputGroup name="Emissive Map">
              <TextureInput value={material.emissiveMap} onChange={this.onChangeEmissiveMap} />
            </InputGroup>
            <InputGroup name="Metalness">
              <CompoundNumericInput value={material.metalness} onChange={this.onChangeMetalness} />
            </InputGroup>
            <InputGroup name="Metalness Map">
              <TextureInput value={material.metalnessMap} onChange={this.onChangeMetalnessMap} />
            </InputGroup>
            <InputGroup name="Roughness">
              <CompoundNumericInput value={material.roughness} onChange={this.onChangeRoughness} />
            </InputGroup>
            <InputGroup name="Roughness Map">
              <TextureInput value={material.roughnessMap} onChange={this.onChangeRoughnessMap} />
            </InputGroup>
            <InputGroup name="Normal Scale">
              <CompoundNumericInput value={material.normalScale.x} onChange={this.onChangeNormalScale} />
            </InputGroup>
            <InputGroup name="Normal Map">
              <TextureInput value={material.normalMap} onChange={this.onChangeNormalMap} />
            </InputGroup>
            <InputGroup name="AO Intensity">
              <CompoundNumericInput value={material.aoMapIntensity} onChange={this.onChangeAOMapIntensity} />
            </InputGroup>
            <InputGroup name="AO Map">
              <TextureInput value={material.aoMap} onChange={this.onChangeAOMap} />
            </InputGroup>
          </>
        )}
      </div>
    );
  }
}
