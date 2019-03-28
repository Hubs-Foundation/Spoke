import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import { withEditor } from "../contexts/EditorContext";
import { withSettings } from "../contexts/SettingsContext";

class ComponentsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired
  };

  onSelect = item => {
    this.props.onSelectItem(item.node);
  };

  renderTooltip = nodeName => {
    const editor = this.props.editor;
    const nodeType = Array.from(editor.nodeTypes).find(nodeType => nodeType.nodeName === nodeName);
    const nodeEditor = editor.nodeEditors.get(nodeType);
    return nodeEditor && nodeEditor.description;
  };

  render() {
    const { editor, settings } = this.props;

    const items = Array.from(editor.nodeTypes).reduce((acc, nodeType) => {
      if (!nodeType.canCreate) {
        return acc;
      }

      if (nodeType.experimental && !settings.enableExperimentalFeatures) {
        return acc;
      }

      const nodeEditor = editor.nodeEditors.get(nodeType);

      acc.push({
        id: nodeType.nodeName,
        name: nodeType.nodeName,
        node: nodeType,
        iconClassName: nodeEditor.iconClassName
      });

      return acc;
    }, []);

    return <LibraryPanel items={items} onSelect={this.onSelect} renderTooltip={this.renderTooltip} />;
  }
}

export default withSettings(withEditor(ComponentsLibrary));
