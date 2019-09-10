import React, { Component } from "react";
import PropTypes from "prop-types";
import { withEditor } from "../contexts/EditorContext";
import DefaultNodeEditor from "./DefaultNodeEditor";
import Panel from "../layout/Panel";
import styled from "styled-components";
import { SlidersH } from "styled-icons/fa-solid/SlidersH";

const PropertiesPanelContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
`;

const NoNodeSelectedMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

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
      content = <NoNodeSelectedMessage>No node selected</NoNodeSelectedMessage>;
    } else if (selected.length > 1) {
      //TODO
      content = <NoNodeSelectedMessage>Multiple Nodes Selected</NoNodeSelectedMessage>;
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
      <Panel id="properties-panel" title="Properties" icon={SlidersH}>
        <PropertiesPanelContent>{content}</PropertiesPanelContent>
      </Panel>
    );
  }
}

export default withEditor(PropertiesPanelContainer);
