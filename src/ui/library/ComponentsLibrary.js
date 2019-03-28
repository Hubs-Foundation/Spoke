import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import { withEditor } from "../contexts/EditorContext";

class ComponentsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired
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
        name: nodeType.nodeName,
        node: nodeType,
        description: nodeEditor.description,
        iconClassName: nodeEditor.iconClassName
      });
    }

    this.state = {
      items
    };
  }

  onSelect = item => {
    this.props.onSelectItem(item.node);
  };

  renderTooltip = nodeName => {
    const item = this.state.items.find(i => i.id === nodeName);
    return item && item.description;
  };

  render() {
    return <LibraryPanel items={this.state.items} onSelect={this.onSelect} renderTooltip={this.renderTooltip} />;
  }
}

export default withEditor(ComponentsLibrary);
