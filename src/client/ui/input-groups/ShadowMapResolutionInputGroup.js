import React, { Component } from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import THREE from "../../vendor/three";

const ShadowMapResolutionOptions = [
  {
    label: "256px",
    value: new THREE.Vector2(256, 256)
  },
  {
    label: "512px",
    value: new THREE.Vector2(512, 512)
  },
  {
    label: "1024px",
    value: new THREE.Vector2(1024, 1024)
  },
  {
    label: "2048px",
    value: new THREE.Vector2(2048, 2048)
  },
  {
    label: "4096px (not recommended)",
    value: new THREE.Vector2(4096, 4096)
  }
];

export default class ShadowMapResolutionInputGroup extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  onChangeShadowMapResolution = shadowMapResolution => {
    this.props.editor.setNodeProperty(this.props.node, "shadowMapResolution", shadowMapResolution);
  };

  render() {
    return (
      <InputGroup name="Shadow Map Resolution">
        <SelectInput
          options={ShadowMapResolutionOptions}
          value={this.props.node.shadowMapResolution}
          onChange={this.onChangeShadowMapResolution}
        />
      </InputGroup>
    );
  }
}
