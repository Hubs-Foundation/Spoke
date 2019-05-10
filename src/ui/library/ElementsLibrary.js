import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import { withEditor } from "../contexts/EditorContext";
import { withSettings } from "../contexts/SettingsContext";

class ElementsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    tooltipId: PropTypes.string
  };

  componentDidMount() {
    this.props.editor.signals.sceneGraphChanged.add(this.onSceneGraphChanged);
  }

  componentWillUnmount() {
    this.props.editor.signals.sceneGraphChanged.remove(this.onSceneGraphChanged);
  }

  onSceneGraphChanged = () => {
    this.forceUpdate();
  };

  onSelect = item => {
    this.props.onSelectItem(item.node, item.node.initialElementProps);
  };

  renderTooltip = nodeName => {
    const editor = this.props.editor;
    const nodeType = Array.from(editor.nodeTypes).find(nodeType => nodeType.nodeName === nodeName);
    const nodeEditor = editor.nodeEditors.get(nodeType);
    return nodeEditor && nodeEditor.description;
  };

  render() {
    const { editor, settings, tooltipId } = this.props;

    const items = Array.from(editor.nodeTypes).reduce((acc, nodeType) => {
      if (!nodeType.canAddNode(editor)) {
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

    return (
      <LibraryPanel items={items} onSelect={this.onSelect} tooltipId={tooltipId} renderTooltip={this.renderTooltip} />
    );
  }
}

export default withSettings(withEditor(ElementsLibrary));
