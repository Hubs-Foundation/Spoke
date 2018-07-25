import React, { Component } from "react";
import PropTypes from "prop-types";
import Select from "react-select";

import "../../vendor/react-select/index.scss";
import styles from "./PropertiesPanelContainer.scss";
import PropertyGroup from "../PropertyGroup";
import InputGroup from "../InputGroup";
import StringInput from "../inputs/StringInput";
import BooleanInput from "../inputs/BooleanInput";
import componentTypeMappings from "../inputs/componentTypeMappings";

import SetValueCommand from "../../editor/commands/SetValueCommand";
import AddComponentCommand from "../../editor/commands/AddComponentCommand";
import SetComponentPropertyCommand from "../../editor/commands/SetComponentPropertyCommand";
import RemoveComponentCommand from "../../editor/commands/RemoveComponentCommand";

import { getDisplayName, types } from "../../editor/components";
import SaveableComponent from "../../editor/components/SaveableComponent";

import { withEditor } from "../contexts/EditorContext";
import { withProject } from "../contexts/ProjectContext";
import { OptionDialog } from "../dialogs/OptionDialog";
import { withDialog } from "../contexts/DialogContext";

class PropertiesPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    project: PropTypes.object,
    openFileDialog: PropTypes.func,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      object: null
    };
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

  onUpdateStatic = value => {
    const object = this.state.object;

    if (object.children.length > 0) {
      this.props.showDialog(OptionDialog, {
        title: "Set Static",
        message: "Do you wish to set this object's children's static flag as well?",
        options: [
          {
            label: "Set object static flag",
            onClick: () => {
              object.userData._static = value;
              this.props.editor.signals.objectChanged.dispatch(this.state.object);
              this.props.hideDialog();
            }
          },
          {
            label: "Set object and children static flag",
            onClick: () => {
              object.traverse(child => {
                child.userData._static = value;
              });
              this.props.editor.signals.objectChanged.dispatch(this.state.object);
              this.props.hideDialog();
            }
          }
        ]
      });
    } else {
      object.userData._static = value;
      this.props.editor.signals.objectChanged.dispatch(this.state.object);
    }
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

  onSaveComponent = (component, saveAs) => {
    if (saveAs || !component.src) {
      this.props.openFileDialog(
        src => {
          component.src = src;
          component.shouldSave = true;
          this.props.project.writeJSON(component.src, component.props);
          component.modified = false;
          this.props.editor.signals.objectChanged.dispatch(this.state.object);
        },
        {
          filters: [component.fileExtension],
          extension: component.fileExtension,
          title: "Save material as...",
          confirmButtonLabel: "Save"
        }
      );
    } else {
      this.props.project.writeJSON(component.src, component.props);
    }
  };

  onLoadComponent = component => {
    this.props.openFileDialog(
      async src => {
        component.src = src;
        component.shouldSave = true;
        component.modified = false;
        component.constructor.inflate(this.state.object, await this.props.project.readJSON(component.src));
        this.props.editor.signals.objectChanged.dispatch(this.state.object);
      },
      {
        filters: [component.fileExtension],
        title: "Load material...",
        confirmButtonLabel: "Load"
      }
    );
  };

  getExtras(prop) {
    switch (prop.type) {
      case types.number:
        return { min: prop.min, max: prop.max };
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

    const objectComponents = object.userData._components || [];

    const componentOptions = [];

    for (const [name, componentClass] of this.props.editor.components) {
      if (componentClass.canAdd !== false && !objectComponents.find(c => c.name === name)) {
        componentOptions.push({
          value: name,
          label: getDisplayName(name)
        });
      }
    }

    return (
      <div className={styles.propertiesPanelContainer}>
        <PropertyGroup name="Node" canRemove={false}>
          <InputGroup name="Name">
            <StringInput value={object.name} onChange={this.onUpdateName} />
          </InputGroup>
          <InputGroup name="Static">
            <BooleanInput value={object.userData._static || false} onChange={this.onUpdateStatic} />
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
              canRemove={componentDefinition.canRemove}
              removeHandler={this.onRemoveComponent.bind(this, component.name)}
              src={component.src}
              saveable={component instanceof SaveableComponent}
              saveHandler={this.onSaveComponent.bind(this, component, false)}
              saveAsHandler={this.onSaveComponent.bind(this, component, true)}
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

export default withProject(withEditor(withDialog(PropertiesPanelContainer)));
