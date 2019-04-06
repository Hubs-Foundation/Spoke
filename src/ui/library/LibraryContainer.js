import React, { Component } from "react";
import LibraryToolbar from "./LibraryToolbar";
import styles from "./LibraryContainer.scss";
import ComponentsLibrary from "./ComponentsLibrary";
//import PrimitivesLibrary from "./PrimitivesLibrary";
import ModelsLibrary from "./ModelsLibrary";
import VideosLibrary from "./VideosLibrary";
import ImagesLibrary from "./ImagesLibrary";
import AssetsLibrary from "./AssetsLibrary";
import { withEditor } from "../contexts/EditorContext";
import { withApi } from "../contexts/ApiContext";
import PropTypes from "prop-types";

class LibraryContainer extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired
  };

  state = {
    selected: null,
    items: [
      {
        id: "components",
        label: "Components",
        iconClassName: "fa-puzzle-piece",
        component: ComponentsLibrary
      },
      {
        id: "assets",
        label: "Assets",
        iconClassName: "fa-folder",
        component: AssetsLibrary
      },
      // {
      //   id: "primitives",
      //   label: "Primitives",
      //   iconClassName: "fa-cube",
      //   component: PrimitivesLibrary
      // },
      {
        id: "models",
        label: "Models",
        iconClassName: "fa-cubes",
        component: ModelsLibrary
      },
      {
        id: "videos",
        label: "Videos",
        iconClassName: "fa-film",
        component: VideosLibrary
      },
      {
        id: "images",
        label: "Images",
        iconClassName: "fa-image",
        component: ImagesLibrary
      }
    ]
  };

  onSelectItem = (NodeType, props, item, source) => {
    const { editor, api } = this.props;
    const node = new NodeType(editor);

    if (props) {
      for (const propName in props) {
        if (props.hasOwnProperty(propName)) {
          node[propName] = props[propName];
        }
      }
    }

    if (source.value === "assets") {
      api.addAssetToProject(editor.projectId, item.id).catch(console.error);
    }

    editor.addObject(node);
  };

  onSelect = item => {
    this.setState({
      selected: item === this.state.selected ? null : item
    });
  };

  render() {
    const { items, selected } = this.state;
    const Component = selected && selected.component;

    return (
      <div className={styles.libraryContainer}>
        {Component && (
          <div className={styles.libraryPanelContainer}>
            <Component onSelectItem={this.onSelectItem} tooltipId="library-container" />
          </div>
        )}
        <LibraryToolbar items={items} selected={selected} onSelect={this.onSelect} />
      </div>
    );
  }
}

export default withEditor(withApi(LibraryContainer));
