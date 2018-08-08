import React, { Component } from "react";
import PropTypes from "prop-types";
import Select from "react-select";

import "../../vendor/react-select/index.scss";
import styles from "./PropertiesPanelContainer.scss";
import PropertyGroup from "../PropertyGroup";
import InputGroup from "../InputGroup";
import StringInput from "../inputs/StringInput";
import componentTypeMappings from "../inputs/componentTypeMappings";

import SetValueCommand from "../../editor/commands/SetValueCommand";
import AddComponentCommand from "../../editor/commands/AddComponentCommand";
import SetComponentPropertyCommand from "../../editor/commands/SetComponentPropertyCommand";
import RemoveComponentCommand from "../../editor/commands/RemoveComponentCommand";

import { types } from "../../editor/components";
import SaveableComponent from "../../editor/components/SaveableComponent";
import { StaticMode, computeStaticMode, getStaticMode, setStaticMode } from "../../editor/StaticMode";

import { withEditor } from "../contexts/EditorContext";
import { withProject } from "../contexts/ProjectContext";
import { withDialog } from "../contexts/DialogContext";
import FileDialog from "../dialogs/FileDialog";
import ErrorDialog from "../dialogs/ErrorDialog";
import ProgressDialog, { PROGRESS_DIALOG_DELAY } from "../dialogs/ProgressDialog";

import { debounce } from "throttle-debounce";
import ConflictError from "../../editor/ConflictError";
const INPUT_DEBOUNCE_THRESHOLD = 500;

export function getDisplayName(name) {
  if (name.includes("-")) {
    return name
      .split("-")
      .map(([f, ...rest]) => f.toUpperCase() + rest.join(""))
      .join(" ");
  } else {
    const displayName = name.replace(/[A-Z]/g, " $&");
    return displayName[0].toUpperCase() + displayName.substr(1);
  }
}

class PropertiesPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    project: PropTypes.object,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      object: null
    };

    this._updateObjectNameDebounced = debounce(INPUT_DEBOUNCE_THRESHOLD, this._updateObjectNameDebounced);
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
    const object = this.state.object;
    if (!object.userData._debounced) {
      object.userData._originalName = object.name;
      object.userData._debounced = true;
    }
    object.name = e.target.value;
    this.setState({ object: object });
    this._updateObjectNameDebounced(object, e.target.value);
  };

  _updateObjectNameDebounced = (object, value) => {
    const handler = this.props.editor._conflictHandler;

    if (handler.isUniqueObjectName(value)) {
      object.name = value;
      handler.addToDuplicateNameCounters(value);
      this.props.editor.execute(new SetValueCommand(object, "name", value));
    } else {
      object.name = object.userData._originalName;
      delete object.userData._originalName;
      this.props.editor.signals.objectChanged.dispatch(object);
      this.props.editor.signals.sceneErrorOccurred.dispatch(
        new ConflictError("rename error", "rename", this.props.editor.sceneInfo.uri, handler)
      );
    }

    object.userData._debounced = false;
  };

  onUpdateStatic = ({ value }) => {
    const object = this.state.object;
    setStaticMode(object, value);
    this.props.editor.signals.objectChanged.dispatch(object);
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

  onSaveComponent = async (component, saveAs) => {
    if (saveAs || !component.src) {
      this.props.showDialog(FileDialog, {
        filters: [component.fileExtension],
        extension: component.fileExtension,
        title: "Save material as...",
        confirmButtonLabel: "Save",
        onConfirm: async src => {
          let saved = false;

          try {
            setTimeout(() => {
              if (saved) return;
              this.props.showDialog(ProgressDialog, {
                title: "Saving Material",
                message: "Saving material..."
              });
            }, PROGRESS_DIALOG_DELAY);

            component.src = src;
            component.srcIsValid = true;
            component.shouldSave = true;
            await this.props.project.writeJSON(component.src, component.props);
            component.modified = false;
            this.props.editor.signals.objectChanged.dispatch(this.state.object);
            this.props.hideDialog();
          } catch (e) {
            this.props.showDialog(ErrorDialog, {
              title: "Error saving material",
              message: e.message || "There was an error when saving the material."
            });
          } finally {
            saved = true;
          }
        }
      });
    } else {
      try {
        await this.props.project.writeJSON(component.src, component.props);
        component.modified = false;
        this.props.editor.signals.objectChanged.dispatch(this.state.object);
      } catch (e) {
        console.error(e);
        this.props.showDialog(ErrorDialog, {
          title: "Error Saving Material",
          message: e.message || "There was an error when saving the material."
        });
      }
    }
  };

  onLoadComponent = component => {
    this.props.showDialog(FileDialog, {
      filters: [component.fileExtension],
      title: "Load material...",
      confirmButtonLabel: "Load",
      onConfirm: async src => {
        let loaded = false;

        try {
          setTimeout(() => {
            if (loaded) return;
            this.props.showDialog(ProgressDialog, {
              title: "Loading Material",
              message: "Loading material..."
            });
          }, PROGRESS_DIALOG_DELAY);

          component.src = src;
          component.srcIsValid = true;
          component.shouldSave = true;
          component.modified = false;
          await component.constructor.inflate(this.state.object, await this.props.project.readJSON(component.src));
          this.props.editor.signals.objectChanged.dispatch(this.state.object);
          this.props.hideDialog();
        } catch (e) {
          console.error(e);
          this.props.showDialog(ErrorDialog, {
            title: "Error Loading Material",
            message: e.message || "There was an error when loading the material."
          });
        } finally {
          loaded = true;
        }
      }
    });
  };

  getExtras(prop) {
    switch (prop.type) {
      case types.number:
        return { min: prop.min, max: prop.max };
      case types.file:
        return { filters: prop.filters };
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

    const staticMode = getStaticMode(object) || StaticMode.Inherits;
    const parentComputedStaticMode = computeStaticMode(object.parent);
    const staticModeOptions = [
      {
        value: StaticMode.Dynamic,
        label: "Dynamic"
      },
      {
        value: StaticMode.Static,
        label: "Static"
      },
      {
        value: StaticMode.Inherits,
        label: `Inherits (${parentComputedStaticMode})`
      }
    ];

    return (
      <div className={styles.propertiesPanelContainer}>
        <PropertyGroup name="Node" canRemove={false}>
          <InputGroup name="Name">
            <StringInput value={object.name} onChange={this.onUpdateName} />
          </InputGroup>
          {object.parent !== null && (
            <InputGroup name="Static">
              <Select
                className={styles.staticSelect}
                value={staticMode}
                options={staticModeOptions}
                clearable={false}
                onChange={this.onUpdateStatic}
              />
            </InputGroup>
          )}
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

          const saveable = component instanceof SaveableComponent;
          return (
            <PropertyGroup
              name={getDisplayName(component.name)}
              key={component.name}
              canRemove={componentDefinition.canRemove}
              removeHandler={this.onRemoveComponent.bind(this, component.name)}
              src={component.src}
              srcIsValid={component.srcIsValid}
              saveable={saveable}
              modified={component.modified}
              saveHandler={this.onSaveComponent.bind(this, component, false)}
              saveAsHandler={this.onSaveComponent.bind(this, component, true)}
              loadHandler={this.onLoadComponent.bind(this, component)}
            >
              {componentDefinition.schema.map(prop => (
                <InputGroup name={getDisplayName(prop.name)} key={prop.name} disabled={saveable && !component.src}>
                  {componentTypeMappings.get(prop.type)(
                    component.props[prop.name],
                    component.propValidation[prop.name],
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
