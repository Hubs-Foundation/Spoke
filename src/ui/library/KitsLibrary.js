import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryPanel from "./LibraryPanel";
import { withEditor } from "../contexts/EditorContext";
import { withSettings } from "../contexts/SettingsContext";
import architectureKitUrl from "../../assets/ArchKitv3.glb";
import KitPieceNode from "../../editor/nodes/KitPieceNode";
import KitPieceNodeEditor from "../properties/KitPieceNodeEditor";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

class KitsLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    tooltipId: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.state = {
      kitUrl: architectureKitUrl,
      items: []
    };
  }

  componentDidMount() {
    // TODO: Cache the kit manifest somewhere else.
    new GLTFLoader().createParser(this.state.kitUrl, ({ json }) => {
      const items = json.nodes
        ? json.nodes.map((nodeDef, index) => ({
            id: index,
            name: nodeDef.name || "",
            node: KitPieceNode,
            iconClassName: KitPieceNodeEditor.iconClassName
          }))
        : [];
      this.setState({ items });
    });
  }

  onSelect = item => {
    const editor = this.props.editor;

    const node = new KitPieceNode(editor);

    node.name = item.name;

    node.load(this.state.kitUrl, item.name);

    this.props.editor.addObject(node);
  };

  renderTooltip = id => {
    const item = this.state.items[id];
    return item ? item.name : "";
  };

  render() {
    const { tooltipId } = this.props;
    const { items } = this.state;

    return (
      <LibraryPanel items={items} onSelect={this.onSelect} tooltipId={tooltipId} renderTooltip={this.renderTooltip} />
    );
  }
}

export default withSettings(withEditor(KitsLibrary));
