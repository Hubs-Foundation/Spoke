import React, { Component } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import "../../vendor/react-select/index.scss";
import styles from "./PropertiesPanelContainer.scss";
import PropertyGroup from "../PropertyGroup";
import InputGroup from "../InputGroup";
import StringInput from "../inputs/StringInput";
import componentTypeMappings from "../../componentTypeMappings";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import FileDialog from "../dialogs/FileDialog";
import ErrorDialog from "../dialogs/ErrorDialog";
import ProgressDialog, { PROGRESS_DIALOG_DELAY } from "../dialogs/ProgressDialog";
import AddComponentDropdown from "../AddComponentDropdown";

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
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      object: null,
      name: null
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
      object,
      name: object.name
    });
  };

  onObjectChanged = object => {
    if (this.state.object === object) {
      this.setState({
        object,
        name: object.name
      });
    }
  };

  onUpdateName = e => {
    this.setState({
      name: e.target.value
    });
  };

  onBlurName = () => {
    this.props.editor.setObjectName(this.state.object, this.state.name);
  };

  onUpdateStatic = ({ value }) => {
    const object = this.state.object;
    this.props.editor.setStaticMode(object, value);
  };

  onAddComponent = ({ value }) => {
    this.props.editor.addComponent(this.state.object, value);
  };

  onChangeComponent = (component, propertyName, value) => {
    this.props.editor.setComponentProperty(this.state.object, component.name, propertyName, value);
  };

  onRemoveComponent = componentName => {
    this.props.editor.removeComponent(this.state.object, componentName);
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

            await this.props.editor.saveComponentAs(this.state.object, component.name, src);

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
        await this.props.editor.saveComponent(this.state.object, component.name);
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

          await this.props.editor.loadComponent(this.state.object, component.name, src);

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

  _renderObjectComponent = (component, className, headerClassName, contentClassName, useDefault = true) => {
    if (!component) return null;
    const componentDefinition = this.props.editor.components.get(component.name);

    if (componentDefinition === undefined) {
      return <PropertyGroup name={getDisplayName(component.name)} key={component.name} />;
    }

    const saveable = component.isSaveable;
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
        className={className}
        headerClassName={headerClassName}
        contentClassName={contentClassName}
        useDefault={useDefault}
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
  };

  getExtras(prop) {
    const ComponentPropTypes = this.props.editor.ComponentPropTypes;
    switch (prop.type) {
      case ComponentPropTypes.number:
        return { min: prop.min, max: prop.max, parse: prop.parse, format: prop.format, step: prop.step };
      case ComponentPropTypes.file:
        return { filters: prop.filters };
      default:
        null;
    }
  }

  render() {
    const object = this.state.object;
    const StaticModes = this.props.editor.StaticModes;

    if (!object) {
      return (
        <div className={styles.propertiesPanelContainer}>
          <div className={styles.noNodeSelected}>No node selected</div>
        </div>
      );
    }

    const objectComponents = object.userData._components
      ? object.userData._components.filter(x => x.name !== "transform")
      : [];
    const objectTransform = object.userData._components
      ? object.userData._components.find(x => x.name === "transform")
      : null;

    const componentOptions = [];

    for (const [name, componentClass] of this.props.editor.components) {
      if (componentClass.canAdd !== false && !objectComponents.find(c => c.name === name)) {
        componentOptions.push({
          value: name,
          label: getDisplayName(name)
        });
      }
    }

    const staticMode = this.props.editor.getStaticMode(object) || StaticModes.Inherits;
    const parentComputedStaticMode = this.props.editor.computeStaticMode(object.parent);
    const staticModeOptions = [
      {
        value: StaticModes.Dynamic,
        label: "Dynamic"
      },
      {
        value: StaticModes.Static,
        label: "Static"
      },
      {
        value: StaticModes.Inherits,
        label: `Inherits (${parentComputedStaticMode})`
      }
    ];

    return (
      <div className={styles.propertiesPanelContainer}>
        <PropertyGroup
          className={styles.propertiesHeader}
          headerClassName={styles.propertiesHeaderTitle}
          contentClassName={styles.propertiesHeaderContent}
          canRemove={false}
        >
          <div className={styles.propertiesPanelTopBar}>
            <InputGroup name="Name">
              <StringInput value={this.state.name} onChange={this.onUpdateName} onBlur={this.onBlurName} />
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
          </div>
          {this._renderObjectComponent(
            objectTransform,
            styles.propertiesHeader,
            styles.propertiesHeader,
            styles.propertiesHeaderContent,
            false
          )}
          <div className={styles.addComponentContainer}>
            <AddComponentDropdown
              placeholder="Add a component"
              className={styles.addComponentSelect}
              options={componentOptions}
              onChange={this.onAddComponent}
            />
          </div>
        </PropertyGroup>
        {objectComponents.map(component => {
          // Generate property groups for each component and property editors for each property.
          return this._renderObjectComponent(component);
        })}
      </div>
    );
  }
}

export default withEditor(withDialog(PropertiesPanelContainer));
