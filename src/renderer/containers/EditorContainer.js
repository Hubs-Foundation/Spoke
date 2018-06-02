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
import { MosaicWindow } from "react-mosaic-component";
import PanelToolbar from "../components/PanelToolbar";
import { withEditor } from "./EditorContext";

class EditorContainer extends Component {
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
    initialPanels: PropTypes.object,
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", this.onWindowResize, false);

    this.state = {
      openProject: null,
      registeredPanels: {
        hierarchy: {
          component: HierarchyPanelContainer,
          windowProps: {
            title: "Hierarchy",
            toolbarControls: PanelToolbar
          }
        },
        viewport: {
          component: ViewportPanelContainer,
          windowProps: {
            title: "Viewport",
            toolbarControls: [],
            draggable: false
          }
        },
        properties: {
          component: PropertiesPanelContainer,
          windowProps: {
            title: "Properties",
            toolbarControls: PanelToolbar
          }
        },
        assetExplorer: {
          component: AssetExplorerPanelContainer,
          windowProps: {
            title: "Asset Explorer",
            toolbarControls: PanelToolbar
          }
        }
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

  componentDidMount() {
    this.props.editor.signals.windowResize.dispatch();
  }

  onWindowResize = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  onPanelChange = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

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

  renderPanel = (panelId, path) => {
    const panel = this.state.registeredPanels[panelId];

    return (
      <MosaicWindow path={path} {...panel.windowProps}>
        <panel.component {...panel.props} />
      </MosaicWindow>
    );
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

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize, false);
  }
}

export default withEditor(EditorContainer);
