import React, { Component } from "react";
import PropTypes from "prop-types";
import PropertyGroup from "../components/PropertyGroup";
import InputGroup from "../components/InputGroup";
import Editor from "../editor/Editor";
import { gltfComponentTypeToReactComponent } from "../components/gltf-type-mappings";
import { getDisplayName } from "../editor/gltf-components";

class GLTFComponentsContainer extends Component {
  static propTypes = {
    components: PropTypes.array
  };
  render() {
    if (!this.props.components) return null;
    return this.props.components.map(component => {
      const componentDefinition = Editor.gltfComponents.get(component.name);
      return (
        <PropertyGroup name={getDisplayName(component.name)} key={component.name}>
          {componentDefinition.schema.map(prop => (
            <InputGroup name={getDisplayName(prop.name)} key={prop.name}>
              {gltfComponentTypeToReactComponent.get(prop.type)(component.props[prop.name])}
            </InputGroup>
          ))}
        </PropertyGroup>
      );
    });
  }
}

export default GLTFComponentsContainer;
