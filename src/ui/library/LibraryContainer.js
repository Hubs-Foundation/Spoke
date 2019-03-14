import React, { Component } from "react";
import LibraryToolbar from "./LibraryToolbar";
import styles from "./LibraryContainer.scss";
import ComponentsLibrary from "./ComponentsLibrary";
import PrimitivesLibrary from "./PrimitivesLibrary";
import ModelsLibrary from "./ModelsLibrary";
import VideosLibrary from "./VideosLibrary";
import ImagesLibrary from "./ImagesLibrary";
import MyFilesLibrary from "./MyFilesLibrary";

export default class LibraryContainer extends Component {
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
        id: "primitives",
        label: "Primitives",
        iconClassName: "fa-cube",
        component: PrimitivesLibrary
      },
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
      },
      {
        id: "files",
        label: "My Files",
        iconClassName: "fa-folder",
        component: MyFilesLibrary
      }
    ]
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
        <div className={styles.libraryPanelContainer}>{Component && <Component />}</div>
        <LibraryToolbar items={items} selected={selected} onSelect={this.onSelect} />
      </div>
    );
  }
}
