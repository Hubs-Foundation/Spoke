import React, { Component } from "react";
import PropTypes from "prop-types";
import NodePropertyGroupContainer from "./NodePropertyGroupContainer";
import GLTFComponentsContainer from "./GLTFComponentsContainer";
import styles from "./PropertiesPanelContainer.scss";
import { withEditor } from "./EditorContext";
import AddGLTFComponentCommand from "../editor/commands/AddGLTFComponentCommand";
import { getDisplayName } from "../editor/gltf-components";

class PropertiesPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
  };
  constructor(props) {
    super(props);
    this.state = {
      currentComponent: "none",
      node: null,
      components: null
    };
    this.props.editor.signals.objectSelected.add(node =>
      this.setState({
        node,
        components: node ? node.userData.MOZ_components : null
      })
    );
    this.props.editor.signals.objectChanged.add(object => {
      if (this.state.node === object) {
        this.setState({ components: object.userData.MOZ_components });
      }
    });
  }
  addComponent = () => {
    if (this.state.currentComponent === "none" || !this.state.node) return;
    this.props.editor.execute(new AddGLTFComponentCommand(this.state.node, this.state.currentComponent));
  };
  render() {
    const gltfComponentOptions = [];
    this.props.editor.gltfComponents.forEach((component, name) => {
      gltfComponentOptions.push(
        <option key={name} value={name}>
          {getDisplayName(name)}
        </option>
      );
    });
    const { node } = this.state;
    return (
      <div className={styles.propertiesPanelContainer}>
        <NodePropertyGroupContainer node={node} />
        <div>
          <select
            value={this.state.currentComponent}
            onChange={e => this.setState({ currentComponent: e.target.value })}
          >
            <option value="none">Select a component</option>
            {gltfComponentOptions}
          </select>
          <button enabled={node} onClick={this.addComponent}>
            add
          </button>
        </div>
        <GLTFComponentsContainer node={node} components={this.state.components} />
      </div>
    );
  }
}

export default withEditor(PropertiesPanelContainer);
