import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import { Vector2 } from "three";

const ShadowMapResolutionOptions = [
  {
    label: "256px",
    value: new Vector2(256, 256)
  },
  {
    label: "512px",
    value: new Vector2(512, 512)
  },
  {
    label: "1024px",
    value: new Vector2(1024, 1024)
  },
  {
    label: "2048px",
    value: new Vector2(2048, 2048)
  },
  {
    label: "4096px (not recommended)",
    value: new Vector2(4096, 4096)
  }
];

export default class LightShadowProperties extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  onChangeShadowMapResolution = shadowMapResolution => {
    this.props.editor.setPropertySelected("shadowMapResolution", shadowMapResolution);
  };

  onChangeCastShadow = castShadow => {
    this.props.editor.setPropertySelected("castShadow", castShadow);
  };

  onChangeShadowBias = shadowBias => {
    this.props.editor.setPropertySelected("shadowBias", shadowBias);
  };

  onChangeShadowRadius = shadowRadius => {
    this.props.editor.setPropertySelected("shadowRadius", shadowRadius);
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
        <NumericInputGroup
          name="Shadow Bias"
          mediumStep={0.00001}
          smallStep={0.0001}
          largeStep={0.001}
          displayPrecision={0.000001}
          value={node.shadowBias}
          onChange={this.onChangeShadowBias}
        />
        <NumericInputGroup
          name="Shadow Radius"
          mediumStep={0.01}
          smallStep={0.1}
          largeStep={1}
          displayPrecision={0.0001}
          value={node.shadowRadius}
          onChange={this.onChangeShadowRadius}
        />
      </Fragment>
    );
  }
}
