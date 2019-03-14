import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import LibraryGrid from "./LibraryGrid";
import { withEditor } from "../contexts/EditorContext";
import styles from "./ComponentsLibrary.scss";

class ComponentsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    const items = [];

    for (const nodeType of props.editor.nodeTypes) {
      if (!nodeType.canCreate) {
        continue;
      }

      const nodeEditor = props.editor.nodeEditors.get(nodeType);

      items.push({
        id: nodeType.nodeName,
        node: nodeType,
        iconClassName: nodeEditor.iconClassName
      });
    }

    this.state = {
      items
    };
  }

  onSelect = item => {
    const editor = this.props.editor;
    const node = new item.node(editor);
    editor.addObject(node);
  };

  renderItem = item => {
    return (
      <div className={styles.componentsLibraryItem}>
        <i className={`fas ${item.iconClassName}`} />
      </div>
    );
  };

  render() {
    return (
      <LibraryPanel>
        <LibraryGrid items={this.state.items} onSelect={this.onSelect} renderItem={this.renderItem} />
      </LibraryPanel>
    );
  }
}

export default withEditor(ComponentsLibrary);
