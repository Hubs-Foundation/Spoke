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
      selected: props.editor.selected
    };
  }

  componentDidMount() {
    const editor = this.props.editor;
    editor.addListener("selectionChanged", this.onSelectionChanged);
    editor.addListener("objectsChanged", this.onObjectsChanged);
  }

  componentWillUnmount() {
    const editor = this.props.editor;
    editor.removeListener("selectionChanged", this.onSelectionChanged);
    editor.removeListener("objectsChanged", this.onObjectsChanged);
  }

  onSelectionChanged = () => {
    this.setState({ selected: this.props.editor.selected });
  };

  onObjectsChanged = objects => {
    const selected = this.props.editor.selected;

    for (let i = 0; i < objects.length; i++) {
      if (selected.indexOf(objects[i]) !== -1) {
        this.setState({ selected: this.props.editor.selected });
        return;
      }
    }
  };

  render() {
    const editor = this.props.editor;
    const selected = this.state.selected;

    if (selected.length === 0) {
      return (
        <div id="properties-panel-container" className={styles.propertiesPanelContainer}>
          <div className={styles.noNodeSelected}>No node selected</div>
        </div>
      );
    }

    if (selected.length > 1) {
      //TODO
      return (
        <div id="properties-panel-container" className={styles.propertiesPanelContainer}>
          <div className={styles.noNodeSelected}>Multiple Nodes Selected</div>
        </div>
      );
    }

    // TODO
    // let NodeEditor = editor.getNodeEditor(selected[0]);

    // const differentNodeTypes = selected.some(selectedNode => editor.getNodeEditor(selectedNode) !== NodeEditor);

    // if (differentNodeTypes) {
    //   NodeEditor = DefaultNodeEditor;
    // }

    const node = selected[0];

    const NodeEditor = editor.getNodeEditor(node) || DefaultNodeEditor;

    return (
      <div id="properties-panel-container" className={styles.propertiesPanelContainer}>
        <NodeEditor node={node} editor={editor} />
      </div>
    );
  }
}

export default withEditor(PropertiesPanelContainer);
