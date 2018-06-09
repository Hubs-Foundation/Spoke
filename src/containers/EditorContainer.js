import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import Editor from "../components/Editor";
import ProjectModalContainer from "./ProjectModalContainer";
import NewProjectModalContainer from "./NewProjectModalContainer";
import ViewportPanelContainer from "./ViewportPanelContainer";
import HierarchyPanelContainer from "./HierarchyPanelContainer";
import PropertiesPanelContainer from "./PropertiesPanelContainer";
import AssetExplorerPanelContainer from "./AssetExplorerPanelContainer";
import { createProjectFromTemplate, addRecentProject, openProject, DEFAULT_PROJECT_DIR_URI } from "../api";
import { MosaicWindow } from "react-mosaic-component";
import PanelToolbar from "../components/PanelToolbar";
import { Provider as ProjectProvider } from "./ProjectContext";
import { withEditor } from "./EditorContext";
import { HotKeys } from "react-hotkeys";
import styles from "./EditorContainer.scss";

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
      project: null,
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
            draggable: true
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
      },
      keyMap: {
        translateTool: "w",
        rotateTool: "e",
        scaleTool: "r",
        undo: ["ctrl+z", "command+z"],
        redo: ["ctrl+shit+z", "command+shift+z"]
      },
      globalHotKeyHandlers: {
        undo: this.onUndo,
        redo: this.onRedo
      }
    };

    this.gltfChangeHandlers = new Map();
  }

  componentDidMount() {
    this.props.editor.signals.windowResize.dispatch();

    this.props.editor.signals.objectAdded.add(object => {
      const gltfRef = object.userData.MOZ_gltf_ref;

      if (gltfRef) {
        const onChange = (event, uri) => this.onGLTFChanged(event, uri, object);
        this.gltfChangeHandlers.set(object, onChange);
        this.state.project.watchFile(gltfRef.uri, onChange);
      }
    });

    this.props.editor.signals.objectRemoved.add(object => {
      const gltfRef = object.userData.MOZ_gltf_ref;

      if (gltfRef) {
        const onChange = this.gltfChangeHandlers.get(object);
        this.state.project.unwatchFile(gltfRef.uri, onChange);
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.project !== prevState.project && prevState.project) {
      prevState.project.close();
    }
  }

  componentWillUnmount() {
    if (this.state.project) {
      this.state.project.close();
    }

    window.removeEventListener("resize", this.onWindowResize, false);
  }

  onWindowResize = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  onPanelChange = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  onOpenProject = async projectDirUri => {
    await addRecentProject(projectDirUri);

    const project = await openProject(projectDirUri);

    this.setState({
      openModal: null,
      project
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
    const project = await createProjectFromTemplate(name, templateUri, projectDirUri);

    await addRecentProject(project.uri);

    this.setState({
      openModal: null,
      project
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

  onUndo = () => {
    this.props.editor.undo();
  };

  onRedo = () => {
    this.props.editor.redo();
  };

  onGLTFChanged = (event, uri, object) => {
    if (event === "changed") {
      this.props.editor.loadGLTF(uri, object);
    } else if (event === "removed") {
      this.props.editor.removeGLTF(uri, object);
      const onChange = this.gltfChangeHandlers.get(object);
      this.state.project.unwatchFile(uri, onChange);
    }
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
    const projectContext = {
      project: this.state.project
    };

    return (
      <ProjectProvider value={projectContext}>
        <DragDropContextProvider backend={HTML5Backend}>
          <HotKeys
            keyMap={this.state.keyMap}
            handlers={this.state.globalHotKeyHandlers}
            className={styles.hotKeysContainer}
          >
            <Editor
              initialPanels={this.props.initialPanels}
              renderPanel={this.renderPanel}
              openModal={this.state.openModal}
              onCloseModal={this.onCloseModal}
              onPanelChange={this.onPanelChange}
            />
          </HotKeys>
        </DragDropContextProvider>
      </ProjectProvider>
    );
  }
}

export default withEditor(EditorContainer);
