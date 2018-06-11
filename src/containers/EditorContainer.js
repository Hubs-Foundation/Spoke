import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import Editor from "../components/Editor";
import ProjectModalContainer from "./ProjectModalContainer";
import NewProjectModalContainer from "./NewProjectModalContainer";
import ExportModalContainer from "./ExportModalContainer";
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
      sceneURI: null,
      sceneModified: null,
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
        save: ["ctrl+s", "command+s"],
        saveAs: ["ctrl+shift+s", "command+shift+s"],
        undo: ["ctrl+z", "command+z"],
        redo: ["ctrl+shit+z", "command+shift+z"],
        export: ["ctrl+b", "command+b"]
      },
      globalHotKeyHandlers: {
        undo: this.onUndo,
        redo: this.onRedo,
        save: this.onSave,
        saveAs: this.onSaveAs,
        export: this.onExport
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

    this.props.editor.signals.openScene.add(this.onOpenScene);
    this.props.editor.signals.sceneGraphChanged.add(this.onSceneChanged);
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

  onSave = async () => {
    if (!this.state.sceneModified && this.state.sceneURI) {
      return;
    }

    try {
      const { json, bin } = await this.props.editor.exportScene();

      let sceneURI;

      if (this.state.sceneURI) {
        sceneURI = await this.state.project.saveScene(this.state.sceneURI, json, bin);
      } else {
        sceneURI = await this.state.project.saveSceneAs(this.props.editor.scene.name, json, bin);
      }

      if (sceneURI === null) {
        return;
      }

      this.setState({
        sceneModified: false,
        sceneURI
      });
    } catch (e) {
      throw e;
    }
  };

  onSaveAs = async () => {
    try {
      const { json, bin } = await this.props.editor.exportScene();

      const sceneURI = await this.state.project.saveSceneAs(this.props.editor.scene.name, json, bin);

      if (sceneURI === null) {
        return;
      }

      this.setState({
        sceneModified: false,
        sceneURI
      });
    } catch (e) {
      throw e;
    }
  };

  onExport = async () => {
    this.setState({
      openModal: {
        component: ExportModalContainer,
        shouldCloseOnOverlayClick: true,
        props: {
          sceneURI: this.state.sceneURI,
          onCloseModal: this.onCloseModal
        }
      }
    });
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

  onSceneChanged = () => {
    if (!this.state.sceneModified) {
      this.setState({ sceneModified: true });
      document.title = `Hubs Editor - ${this.props.editor.scene.name}*`;
    }
  };

  onOpenScene = uri => {
    if (this.state.sceneURI === uri) {
      return;
    }

    if (
      this.state.sceneModified &&
      !confirm("This scene has unsaved changes do you really want to really want to open a new scene without saving?")
    ) {
      return;
    }

    this.props.editor.clear();
    this.props.editor.loadGLTFScene(uri);

    // Set state after sceneGraphChanged signals have fired.
    setTimeout(() => {
      this.setState({
        sceneURI: uri,
        sceneLastSaved: new Date(),
        sceneModified: false
      });

      document.title = `Hubs Editor - ${this.props.editor.scene.name}`;
    }, 0);
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
