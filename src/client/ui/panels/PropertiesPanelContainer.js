import React, { Component } from "react";
import PropTypes from "prop-types";
import Select from "react-select";

import "../../vendor/react-select/index.scss";
import styles from "./PropertiesPanelContainer.scss";
import PropertyGroup from "../PropertyGroup";
import InputGroup from "../InputGroup";
import Vector3Input from "../inputs/Vector3Input";
import StringInput from "../inputs/StringInput";
import componentTypeMappings from "../inputs/componentTypeMappings";

import SetValueCommand from "../../editor/commands/SetValueCommand";
import SetPositionCommand from "../../editor/commands/SetPositionCommand";
import SetRotationCommand from "../../editor/commands/SetRotationCommand";
import SetScaleCommand from "../../editor/commands/SetScaleCommand";
import AddComponentCommand from "../../editor/commands/AddComponentCommand";
import SetComponentPropertyCommand from "../../editor/commands/SetComponentPropertyCommand";
import RemoveComponentCommand from "../../editor/commands/RemoveComponentCommand";

import { getDisplayName, types } from "../../editor/components";
import SaveableComponent from "../../editor/components/SaveableComponent";

import { withEditor } from "../contexts/EditorContext";
import { withProject } from "../contexts/ProjectContext";

const { RAD2DEG, DEG2RAD } = THREE.Math;

class PropertiesPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    project: PropTypes.object,
    openFileDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      object: null
    };

    this.positionVector = new THREE.Vector3();
    this.rotationEuler = new THREE.Euler();
    this.degreesVector = new THREE.Vector3();
    this.scaleVector = new THREE.Vector3();
  }

  componentDidMount() {
    this.props.editor.signals.objectSelected.add(this.onObjectSelected);
    this.props.editor.signals.transformChanged.add(this.onObjectChanged);
    this.props.editor.signals.objectChanged.add(this.onObjectChanged);
  }

  componentWillUnmount() {
    this.props.editor.signals.objectSelected.remove(this.onObjectSelected);
    this.props.editor.signals.transformChanged.remove(this.onObjectChanged);
    this.props.editor.signals.objectChanged.remove(this.onObjectChanged);
  }

  onObjectSelected = object => {
    this.setState({
      object
    });
  };

  onObjectChanged = object => {
    if (this.state.object === object) {
      this.setState({
        object
      });
    }
  };

  onUpdateName = e => {
    this.props.editor.execute(new SetValueCommand(this.state.object, "name", e.target.value));
  };

  onUpdatePosition = newPosition => {
    this.props.editor.execute(new SetPositionCommand(this.state.object, this.positionVector.copy(newPosition)));
  };

  onUpdateRotation = newRotation => {
    this.rotationEuler.set(newRotation.x * DEG2RAD, newRotation.y * DEG2RAD, newRotation.z * DEG2RAD);
    this.props.editor.execute(new SetRotationCommand(this.state.object, this.rotationEuler));
  };

  onUpdateScale = newScale => {
    this.props.editor.execute(new SetScaleCommand(this.state.object, this.scaleVector.copy(newScale)));
  };

  onAddComponent = ({ value }) => {
    this.props.editor.execute(new AddComponentCommand(this.state.object, value));
  };

  onChangeComponent = (component, propertyName, value) => {
    if (component instanceof SaveableComponent) {
      component.modified = true;
    }
    this.props.editor.execute(new SetComponentPropertyCommand(this.state.object, component.name, propertyName, value));
  };

  onRemoveComponent = componentName => {
    this.props.editor.execute(new RemoveComponentCommand(this.state.object, componentName));
  };

  onSaveComponent = component => {
    if (!component.uri) {
      this.props.openFileDialog(
        uri => {
          component.uri = uri;
          this.props.project.writeJSON(component.uri, component.props);
          component.modified = false;
        },
        [component.fileExtension]
      );
    } else {
      this.props.project.writeJSON(component.uri, component.props);
    }
  };

  onLoadComponent = component => {
    this.props.openFileDialog(
      async uri => {
        component.uri = uri;
        component.modified = false;
        component.constructor.inflate(this.state.object, await this.props.project.readJSON(component.uri));
      },
      [component.fileExtension]
    );
  };

  getExtras(prop) {
    switch (prop.type) {
      case types.file:
        return { openFileDialog: this.props.openFileDialog, filters: prop.filters };
      default:
        null;
    }
  }

  render() {
    const object = this.state.object;

    if (!object) {
      return (
        <div className={styles.propertiesPanelContainer}>
          <div className={styles.noNodeSelected}>No node selected</div>
        </div>
      );
    }

    const rotation = object.rotation;
    this.degreesVector.set(rotation.x * RAD2DEG, rotation.y * RAD2DEG, rotation.z * RAD2DEG);

    const componentOptions = [];

    for (const [name] of this.props.editor.components) {
      componentOptions.push({
        value: name,
        label: getDisplayName(name)
      });
    }

    const objectComponents = object.userData._components || [];

    return (
      <div className={styles.propertiesPanelContainer}>
        <PropertyGroup name="Node" removable={false}>
          <InputGroup name="Name">
            <StringInput value={object.name} onChange={this.onUpdateName} />
          </InputGroup>
          <InputGroup name="Position">
            <Vector3Input value={object.position} onChange={this.onUpdatePosition} />
          </InputGroup>
          <InputGroup name="Rotation">
            <Vector3Input value={this.degreesVector} onChange={this.onUpdateRotation} />
          </InputGroup>
          <InputGroup name="Scale">
            <Vector3Input value={object.scale} onChange={this.onUpdateScale} />
          </InputGroup>
          <div className={styles.addComponentContainer}>
            <Select
              placeholder="Add a component..."
              className={styles.addComponentSelect}
              options={componentOptions}
              onChange={this.onAddComponent}
            />
          </div>
        </PropertyGroup>
        {objectComponents.map(component => {
          // Generate property groups for each component and property editors for each property.
          const componentDefinition = this.props.editor.components.get(component.name);

          if (componentDefinition === undefined) {
            return <PropertyGroup name={getDisplayName(component.name)} key={component.name} />;
          }

          return (
            <PropertyGroup
              name={getDisplayName(component.name)}
              key={component.name}
              removable={true}
              removeHandler={this.onRemoveComponent.bind(this, component.name)}
              uri={component.uri}
              saveable={component instanceof SaveableComponent}
              saveHandler={this.onSaveComponent.bind(this, component)}
              loadHandler={this.onLoadComponent.bind(this, component)}
            >
              {componentDefinition.schema.map(prop => (
                <InputGroup name={getDisplayName(prop.name)} key={prop.name}>
                  {componentTypeMappings.get(prop.type)(
                    component.props[prop.name],
                    this.onChangeComponent.bind(null, component, prop.name),
                    this.getExtras(prop)
                  )}
                </InputGroup>
              ))}
            </PropertyGroup>
          );
        })}
      </div>
    );
  }
}

export default withProject(withEditor(PropertiesPanelContainer));
