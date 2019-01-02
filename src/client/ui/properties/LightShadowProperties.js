import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";
import NumericInput from "../inputs/NumericInput";
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

export default class LightShadowProperties extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  onChangeShadowMapResolution = shadowMapResolution => {
    this.props.editor.setNodeProperty(this.props.node, "shadowMapResolution", shadowMapResolution);
  };

  onChangeCastShadow = castShadow => {
    this.props.editor.setNodeProperty(this.props.node, "castShadow", castShadow);
  };

  onChangeShadowBias = shadowBias => {
    this.props.editor.setNodeProperty(this.props.node, "shadowBias", shadowBias);
  };

  onChangeShadowRadius = shadowRadius => {
    this.props.editor.setNodeProperty(this.props.node, "shadowRadius", shadowRadius);
  };

  render() {
    const node = this.props.node;

    return (
      <Fragment>
        <InputGroup name="Cast Shadow">
          <BooleanInput value={node.castShadow} onChange={this.onChangeCastShadow} />
        </InputGroup>
        <InputGroup name="Shadow Map Resolution">
          <SelectInput
            options={ShadowMapResolutionOptions}
            value={node.shadowMapResolution}
            onChange={this.onChangeShadowMapResolution}
          />
        </InputGroup>
        <InputGroup name="Shadow Bias">
          <NumericInput
            min={0}
            mediumStep={0.00001}
            smallStep={0.0001}
            bigStep={0.001}
            precision={0.000001}
            value={node.shadowBias}
            onChange={this.onChangeShadowBias}
          />
        </InputGroup>
        <InputGroup name="Shadow Radius">
          <NumericInput
            mediumStep={0.01}
            smallStep={0.1}
            bigStep={1}
            precision={0.0001}
            value={node.shadowRadius}
            onChange={this.onChangeShadowRadius}
          />
        </InputGroup>
      </Fragment>
    );
  }
}
