import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./PropertiesPanelContainer.scss";
import { withEditor } from "../contexts/EditorContext";
import DefaultNodeEditor from "./DefaultNodeEditor";
import Panel from "../layout/Panel";

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

    let content;

    if (selected.length === 0) {
      content = <div className={styles.noNodeSelected}>No node selected</div>;
    } else if (selected.length > 1) {
      //TODO
      content = <div className={styles.noNodeSelected}>Multiple Nodes Selected</div>;
    } else {
      // TODO
      // let NodeEditor = editor.getNodeEditor(selected[0]);

      // const differentNodeTypes = selected.some(selectedNode => editor.getNodeEditor(selectedNode) !== NodeEditor);

      // if (differentNodeTypes) {
      //   NodeEditor = DefaultNodeEditor;
      // }

      const node = selected[0];

      const NodeEditor = editor.getNodeEditor(node) || DefaultNodeEditor;

      content = <NodeEditor node={node} editor={editor} />;
    }

    // id used in onboarding

    return (
      <Panel id="properties-panel" title="Properties" icon="fa-sliders-h">
        {content}
      </Panel>
    );
  }
}

export default withEditor(PropertiesPanelContainer);
