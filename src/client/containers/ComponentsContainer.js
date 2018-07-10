import React, { Component } from "react";
import PropTypes from "prop-types";
import { withEditor } from "./EditorContext";
import PropertyGroup from "../components/PropertyGroup";
import InputGroup from "../components/InputGroup";
import { componentTypeToReactComponent } from "../components/component-type-mappings";
import { getDisplayName } from "../editor/components";
import SetComponentPropertyCommand from "../editor/commands/SetComponentPropertyCommand";
import RemoveComponentCommand from "../editor/commands/RemoveComponentCommand";

class ComponentsContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object.isRequired,
    components: PropTypes.array.isRequired
  };

  onChange = (componentName, propertyName, value) => {
    this.props.editor.execute(new SetComponentPropertyCommand(this.props.node, componentName, propertyName, value));
  };

  onRemove = componentName => {
    this.props.editor.execute(new RemoveComponentCommand(this.props.node, componentName));
  };

  render() {
    // Generate property groups for each component and property editors for each property.
    return this.props.components.map(component => {
      const componentDefinition = this.props.editor.components.get(component.name);

      if (componentDefinition === undefined) {
        return <PropertyGroup name={getDisplayName(component.name)} key={component.name} />;
      }

      return (
        <PropertyGroup name={getDisplayName(component.name)} key={component.name} removable={true} removeHandler={this.onRemove}>
          {componentDefinition.schema.map(prop => (
            <InputGroup name={getDisplayName(prop.name)} key={prop.name}>
              {componentTypeToReactComponent.get(prop.type)(
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

export default withEditor(ComponentsContainer);
