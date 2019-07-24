import React, { Component } from "react";
import LibraryToolbar from "./LibraryToolbar";
import ElementsLibrary from "./ElementsLibrary";
import ModelsLibrary from "./ModelsLibrary";
import VideosLibrary from "./VideosLibrary";
import ImagesLibrary from "./ImagesLibrary";
import AssetsLibrary from "./AssetsLibrary";
import { withEditor } from "../contexts/EditorContext";
import { withApi } from "../contexts/ApiContext";
import PropTypes from "prop-types";
import styled from "styled-components";

const StyledLibraryContainer = styled.div`
  position: relative;
`;

const LibraryPanelContainer = styled.div`
  pointer-events: all;
  left: 0;
  right: 0;
  bottom: 0;
  height: 200px;
  display: flex;
`;

class LibraryContainer extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired
  };

  state = {
    selected: null,
    items: [
      {
        id: "elements",
        label: "Elements",
        iconClassName: "fa-code",
        component: ElementsLibrary
      },
      {
        id: "models",
        label: "Models",
        iconClassName: "fa-cube",
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
        id: "assets",
        label: "My Assets",
        iconClassName: "fa-folder",
        component: AssetsLibrary
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

    if (source && source.value === "assets") {
      api.addAssetToProject(editor.projectId, item.id).catch(console.error);
    }

    if (!node.disableTransform) {
      editor.getSpawnPosition(node.position);
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
      <StyledLibraryContainer id="library-container">
        {Component && (
          <LibraryPanelContainer>
            <Component onSelectItem={this.onSelectItem} tooltipId="library-container" />
          </LibraryPanelContainer>
        )}
        <LibraryToolbar items={items} selected={selected} onSelect={this.onSelect} />
      </StyledLibraryContainer>
    );
  }
}

export default withEditor(withApi(LibraryContainer));
