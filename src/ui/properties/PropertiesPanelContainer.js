import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./PropertiesPanelContainer.scss";
import { withEditor } from "../contexts/EditorContext";
import DefaultNodeEditor from "./DefaultNodeEditor";

class PropertiesPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      node: null
    };
  }

  componentDidMount() {
    this.props.editor.signals.objectSelected.add(this.onNodeSelected);
    this.props.editor.signals.objectChanged.add(this.onNodeChanged);
  }

  componentWillUnmount() {
    this.props.editor.signals.objectSelected.remove(this.onNodeSelected);
    this.props.editor.signals.objectChanged.remove(this.onNodeChanged);
  }

  onNodeSelected = node => {
    this.setState({ node });
  };

  onNodeChanged = node => {
    if (this.state.node === node) {
      this.setState({ node });
    }
  };

  render() {
    const node = this.state.node;

    if (!node) {
      return (
        <div id="properties-panel-container" className={styles.propertiesPanelContainer}>
          <div className={styles.noNodeSelected}>No node selected</div>
        </div>
      );
    }

    const editor = this.props.editor;
    const NodeEditor = editor.getNodeEditor(node) || DefaultNodeEditor;

    return (
      <div id="properties-panel-container" className={styles.propertiesPanelContainer}>
        <NodeEditor node={node} editor={editor} />
      </div>
    );
  }
}

export default withEditor(PropertiesPanelContainer);
