import React, { Component } from "react";
import PropTypes from "prop-types";
import Editor from "../components/Editor";
import ProjectModalContainer from "./ProjectModalContainer";
import NewProjectModalContainer from "./NewProjectModalContainer";
import ViewportPanelContainer from "./ViewportPanelContainer";
import HierarchyPanelContainer from "./HierarchyPanelContainer";
import PropertiesPanelContainer from "./PropertiesPanelContainer";
import AssetExplorerPanelContainer from "./AssetExplorerPanelContainer";
import { createProject, addRecentProject, DEFAULT_PROJECT_DIR_URI } from "../api";

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
      openProject: null,
      registeredPanels: {
        hierarchy: HierarchyPanelContainer,
        viewport: ViewportPanelContainer,
        properties: PropertiesPanelContainer,
        assetExplorer: AssetExplorerPanelContainer
      },
      openModal: {
        component: ProjectModalContainer,
        shouldCloseOnOverlayClick: false,
        props: {
          onOpenProject: this.onOpenProject,
          onNewProject: this.onNewProject
        }
      }
    };
  }

  onOpenProject = async projectDirUri => {
    await addRecentProject(projectDirUri);

    this.setState({
      openModal: null,
      openProject: projectDirUri
    });
  };

  onNewProject = template => {
    this.setState({
      openModal: {
        component: NewProjectModalContainer,
        shouldCloseOnOverlayClick: false,
        props: {
          defaultProjectDir: DEFAULT_PROJECT_DIR_URI,
          template,
          onCancel: this.onCancelNewProject,
          onCreate: this.onCreateProject
        }
      }
    });
  };

  onCreateProject = async (name, templateUri, projectDirUri) => {
    const project = await createProject(name, templateUri, projectDirUri);

    await addRecentProject(project.uri);

    this.setState({
      openModal: null,
      openProject: project.uri
    });
  };

  onCancelNewProject = () => {
    this.setState({
      openModal: {
        component: ProjectModalContainer,
        shouldCloseOnOverlayClick: false,
        props: {
          onOpenProject: this.onOpenProject,
          onNewProject: this.onNewProject
        }
      }
    });
  };

  onCloseModal = () => {
    this.setState({
      openModal: null
    });
  };

  onPanelChange = e => {
    console.log(e);
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
        onPanelChange={this.onPanelChange}
      />
    );
  }
}
