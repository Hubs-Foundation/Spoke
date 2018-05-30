import React, { Component } from "react";
import PropTypes from "prop-types";
import Editor from "../components/Editor";
import ProjectModalContainer from "./ProjectModalContainer";
import ViewportPanelContainer from "./ViewportPanelContainer";
import HierarchyPanelContainer from "./HierarchyPanelContainer";
import PropertiesPanelContainer from "./PropertiesPanelContainer";
import AssetExplorerPanelContainer from "./AssetExplorerPanelContainer";

export default class EditorContainer extends Component {
  static defaultProps = {
    initialPanels: {
      direction: "column",
      first: {
        direction: "row",
        first: {
          direction: "row",
          first: "hierarchy",
          second: "viewport",
          splitPercentage: 33.333
        },
        second: "properties",
        splitPercentage: 75
      },
      second: "assetExplorer",
      splitPercentage: 70
    }
  };

  static propTypes = {
    initialPanels: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      gltfURI: null,
      registeredPanels: {
        hierarchy: HierarchyPanelContainer,
        viewport: ViewportPanelContainer,
        properties: PropertiesPanelContainer,
        assetExplorer: AssetExplorerPanelContainer
      },
      openModal: {
        component: ProjectModalContainer,
        shouldCloseOnOverlayClick: false
      }
    };
  }

  onLoadGLTF = gltfURI => {
    this.setState({
      openModal: null,
      gltfURI
    });
  };

  onCloseModal = () => {
    this.setState({
      openModal: null
    });
  };

  renderPanel = (panelId, path) => {
    const PanelComponent = this.state.registeredPanels[panelId];
    return <PanelComponent path={path} />;
  };

  render() {
    return (
      <Editor
        initialPanels={this.props.initialPanels}
        renderPanel={this.renderPanel}
        openModal={this.state.openModal}
        onCloseModal={this.onCloseModal}
        gltfURI={this.state.gltfURI}
        onLoadGLTF={this.onLoadGLTF}
      />
    );
  }
}
