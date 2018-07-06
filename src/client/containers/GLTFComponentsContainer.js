import React, { Component } from "react";
import PropTypes from "prop-types";
import { withEditor } from "./EditorContext";
import PropertyGroup from "../components/PropertyGroup";
import InputGroup from "../components/InputGroup";
import { gltfComponentTypeToReactComponent } from "../components/gltf-type-mappings";
import { getDisplayName } from "../editor/gltf-components";
import SetGLTFComponentPropertyCommand from "../editor/commands/SetGLTFComponentPropertyCommand";

class GLTFComponentsContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object.isRequired,
    components: PropTypes.array.isRequired
  };

  onChange = (componentName, propertyName, value) => {
    this.props.editor.execute(new SetGLTFComponentPropertyCommand(this.props.node, componentName, propertyName, value));
  };

  render() {
    // Generate property groups for each component and property editors for each property.
    return this.props.components.map(component => {
      const componentDefinition = this.props.editor.gltfComponents.get(component.name);

      if (componentDefinition === undefined) {
        return <PropertyGroup name={getDisplayName(component.name)} key={component.name} />;
      }

      return (
        <PropertyGroup name={getDisplayName(component.name)} key={component.name}>
          {componentDefinition.schema.map(prop => (
            <InputGroup name={getDisplayName(prop.name)} key={prop.name}>
              {gltfComponentTypeToReactComponent.get(prop.type)(
                component.props[prop.name],
                this.onChange.bind(null, component.name, prop.name)
              )}
            </InputGroup>
          ))}
        </PropertyGroup>
      );
    });
  }
}

export default withEditor(GLTFComponentsContainer);
