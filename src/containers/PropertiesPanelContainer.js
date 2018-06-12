import React, { Component } from "react";
import PropTypes from "prop-types";
import NodePropertyGroupContainer from "./NodePropertyGroupContainer";
import styles from "./PropertiesPanelContainer.scss";
import Editor from "../editor/Editor";
import { withEditor } from "./EditorContext";
import AddGLTFComponentCommand from "../editor/commands/AddGLTFComponentCommand";

class PropertiesPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
  };
  constructor(props) {
    super(props);
    this.state = {
      currentComponent: "none",
      node: null
    };
    this.props.editor.signals.objectSelected.add(node => this.setState({ node }));
  }
  addComponent = () => {
    if (this.state.currentComponent === "none" || !this.state.node) return;
    this.props.editor.execute(new AddGLTFComponentCommand(this.state.node, this.state.currentComponent));
  };
  render() {
    const gltfComponentOptions = [];
    // TODO Maybe don't use a static method
    Editor.gltfComponents.forEach((component, name) => {
      const displayName = name
        .split("-")
        .map(([f, ...rest]) => f.toUpperCase() + rest.join(""))
        .join(" ");
      gltfComponentOptions.push(
        <option key={name} value={name}>
          {displayName}
        </option>
      );
    });
    return (
      <div className={styles.propertiesPanelContainer}>
        <NodePropertyGroupContainer node={this.state.node} />
        <div>
          <select
            value={this.state.currentComponent}
            onChange={e => this.setState({ currentComponent: e.target.value })}
          >
            <option value="none">Select a component</option>
            {gltfComponentOptions}
          </select>
          <button enabled={this.state.node} onClick={this.addComponent}>
            add
          </button>
        </div>
      </div>
    );
  }
}

export default withEditor(PropertiesPanelContainer);
