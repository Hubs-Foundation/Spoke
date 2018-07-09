import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { MosaicWindow } from "react-mosaic-component";
import { HotKeys } from "react-hotkeys";
import last from "lodash.last";

import Editor from "../components/Editor";
import FileDialogModalContainer from "./FileDialogModalContainer";
import ViewportPanelContainer from "./ViewportPanelContainer";
import HierarchyPanelContainer from "./HierarchyPanelContainer";
import PropertiesPanelContainer from "./PropertiesPanelContainer";
import AssetExplorerPanelContainer from "./AssetExplorerPanelContainer";
import ViewportToolbarContainer from "./ViewportToolbarContainer";
import PanelToolbar from "../components/PanelToolbar";
import { withProject } from "./ProjectContext";
import { withEditor } from "./EditorContext";
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
    editor: PropTypes.object,
    project: PropTypes.object
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", this.onWindowResize, false);

    this.state = {
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
            toolbarControls: ViewportToolbarContainer(),
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
      openModal: null,
      keyMap: {
        translateTool: "w",
        rotateTool: "e",
        scaleTool: "r",
        delete: "del",
        duplicate: ["ctrl+d", "command+d"],
        save: ["ctrl+s", "command+s"],
        saveAs: ["ctrl+shift+s", "command+shift+s"],
        undo: ["ctrl+z", "command+z"],
        redo: ["ctrl+shift+z", "command+shift+z"],
        bundle: ["ctrl+b", "command+b"]
      },
      globalHotKeyHandlers: {
        undo: this.onUndo,
        redo: this.onRedo,
        save: this.onSave,
        saveAs: this.onSaveAs,
        bundle: this.onOpenBundleModal
      }
    };
  }

  componentDidMount() {
    this.props.editor.signals.windowResize.dispatch();
    this.props.editor.signals.popScene.add(this.onPopScene);
    this.props.editor.signals.openScene.add(this.onOpenScene);
    this.props.editor.signals.sceneGraphChanged.add(this.onSceneChanged);
    this.props.project.addListener("change", path => {
      const url = new URL(path, window.location).href;
      this.props.editor.signals.fileChanged.dispatch(url);
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.project !== prevProps.project && prevProps.project) {
      prevProps.project.close();
    }
  }

  componentWillUnmount() {
    if (this.props.project) {
      this.props.project.close();
    }

    window.removeEventListener("resize", this.onWindowResize, false);
  }

  onWindowResize = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  onPanelChange = () => {
    this.props.editor.signals.windowResize.dispatch();
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

  openSaveAsDialog(onSave) {
    this.setState({
      openModal: {
        component: FileDialogModalContainer,
        shouldCloseOnOverlayClick: true,
        props: {
          title: "Save scene as...",
          confirmButtonLabel: "Save as...",
          filter: ".scene",
          onConfirm: onSave,
          onCancel: this.onCloseModal
        }
      }
    });
  }

  onSave = async e => {
    e.preventDefault();

    if (!this.props.editor.sceneURI || this.props.editor.sceneURI.endsWith(".gltf")) {
      this.openSaveAsDialog(this.exportAndSaveScene);
    } else {
      this.exportAndSaveScene(this.props.editor.sceneURI);
    }
  };

  onSaveAs = e => {
    e.preventDefault();
    this.openSaveAsDialog(this.exportAndSaveScene);
  };

  exportAndSaveScene = async sceneURI => {
    try {
      const serializedScene = this.props.editor.serializeScene(sceneURI);
      await this.props.project.writeJSON(sceneURI, serializedScene);

      this.props.editor.setSceneURI(sceneURI);
      last(this.props.editor.scenes).modified = false;
      this.setState({
        openModal: null
      });
    } catch (e) {
      throw e;
    }
  };

  onOpenBundleModal = e => {
    e.preventDefault();

    if (!this.props.editor.sceneURI) {
      console.warn("TODO: save scene before bundling instead of doing nothing");
      return;
    }

    this.setState({
      openModal: {
        component: FileDialogModalContainer,
        shouldCloseOnOverlayClick: true,
        props: {
          title: "Select glTF bundle output directory",
          confirmButtonLabel: "Bundle scene...",
          directory: true,
          onConfirm: this.onBundle,
          onCancel: this.onCloseModal
        }
      }
    });
  };

  onBundle = async outputPath => {
    await this.props.project.bundleScene(this.props.editor.scene.name, "0.1.0", this.props.editor.sceneURI, outputPath);
    this.setState({ openModal: null });
  };

  onSceneChanged = () => {
    document.title = `Hubs Editor - ${this.props.editor.scene.name}*`;
  };

  confirmSceneChange = () => {
    return (
      !this.props.editor.sceneModified() ||
      confirm("This scene has unsaved changes. Do you really want to really want to change scenes without saving?")
    );
  };

  onPopScene = () => {
    if (!this.confirmSceneChange()) return;
    this.props.editor.popScene();
  };

  onOpenScene = uri => {
    const uriPath = new URL(this.props.editor.sceneURI, window.location);
    if (uriPath.pathname === uri) return;
    if (!this.confirmSceneChange()) return;

    const url = new URL(uri, window.location);

    this.props.editor
      .openRootScene(url.href)
      .then(scene => {
        document.title = `Hubs Editor - ${scene.name}`;
      })
      .catch(e => {
        console.error(e);
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
    );
  }
}

export default withProject(withEditor(EditorContainer));
