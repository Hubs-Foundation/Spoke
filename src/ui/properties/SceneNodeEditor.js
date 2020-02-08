import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import { Globe } from "styled-icons/fa-solid/Globe";
import NumericInputGroup from "../inputs/NumericInputGroup";
import ColorInput from "../inputs/ColorInput";
import InputGroup from "../inputs/InputGroup";
import { FogType } from "../../editor/nodes/SceneNode";
import SelectInput from "../inputs/SelectInput";

const FogTypeOptions = [
  {
    label: "Disabled",
    value: FogType.Disabled
  },
  {
    label: "Linear",
    value: FogType.Linear
  },
  {
    label: "Exponential",
    value: FogType.Exponential
  }
];

export default class SceneNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object
  };

  static iconComponent = Globe;

  static description = "The root object of the scene.";

  onChangeBackground = background => {
    this.props.editor.setPropertySelected("background", background);
  };

  onChangeFogType = fogType => {
    this.props.editor.setPropertySelected("fogType", fogType);
  };

  onChangeFogColor = fogColor => {
    this.props.editor.setPropertySelected("fogColor", fogColor);
  };

  onChangeFogNearDistance = fogNearDistance => {
    this.props.editor.setPropertySelected("fogNearDistance", fogNearDistance);
  };

  onChangeFogFarDistance = fogFarDistance => {
    this.props.editor.setPropertySelected("fogFarDistance", fogFarDistance);
  };

  onChangeFogDensity = fogDensity => {
    this.props.editor.setPropertySelected("fogDensity", fogDensity);
  };

  render() {
    const node = this.props.node;

    return (
      <NodeEditor {...this.props} description={SceneNodeEditor.description}>
        <InputGroup name="Background Color">
          <ColorInput value={node.background} onChange={this.onChangeBackground} />
        </InputGroup>
        <InputGroup name="Fog Type">
          <SelectInput options={FogTypeOptions} value={node.fogType} onChange={this.onChangeFogType} />
        </InputGroup>
        {node.fogType !== FogType.Disabled && (
          <InputGroup name="Fog Color">
            <ColorInput value={node.fogColor} onChange={this.onChangeFogColor} />
          </InputGroup>
        )}
        {node.fogType === FogType.Linear && (
          <>
            <NumericInputGroup
              name="Fog Near Distance"
              smallStep={0.1}
              mediumStep={1}
              largeStep={10}
              min={0}
              value={node.fogNearDistance}
              onChange={this.onChangeFogNearDistance}
            />
            <NumericInputGroup
              name="Fog Far Distance"
              smallStep={1}
              mediumStep={100}
              largeStep={1000}
              min={0}
              value={node.fogFarDistance}
              onChange={this.onChangeFogFarDistance}
            />
          </>
        )}
        {node.fogType === FogType.Exponential && (
          <NumericInputGroup
            name="Fog Density"
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={0.25}
            min={0}
            value={node.fogDensity}
            onChange={this.onChangeFogDensity}
          />
        )}
      </NodeEditor>
    );
  }
}
