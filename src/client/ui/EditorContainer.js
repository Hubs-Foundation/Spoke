import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "@mozillareality/react-dnd-html5-backend";
import { MosaicWindow } from "react-mosaic-component";
import { HotKeys } from "react-hotkeys";
import Modal from "react-modal";
import { MosaicWithoutDragDropContext } from "react-mosaic-component";
import ToolBar from "./menus/ToolBar";
import ViewportPanelContainer from "./panels/ViewportPanelContainer";
import HierarchyPanelContainer from "./panels/HierarchyPanelContainer";
import PropertiesPanelContainer from "./panels/PropertiesPanelContainer";
import AssetExplorerPanelContainer from "./panels/AssetExplorerPanelContainer";
import { EditorContextProvider } from "./contexts/EditorContext";
import { DialogContextProvider } from "./contexts/DialogContext";
import { SceneActionsContextProvider } from "./contexts/SceneActionsContext";
import ConfirmDialog from "./dialogs/ConfirmDialog";
import styles from "../common.scss";
import FileDialog from "./dialogs/FileDialog";
import ProgressDialog from "./dialogs/ProgressDialog";
import ErrorDialog from "./dialogs/ErrorDialog";
import ConflictError from "../editor/ConflictError";
import { getUrlDirname, getUrlFilename } from "../utils/url-path";

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
          splitPercentage: 33.4
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
      registeredPanels: {
        hierarchy: {
          component: HierarchyPanelContainer,
          windowProps: {
            className: "hierarchyPanel",
            title: "Hierarchy",
            toolbarControls: [],
            draggable: false
          }
        },
        viewport: {
          component: ViewportPanelContainer,
          windowProps: {
            className: "viewportPanel",
            title: "Viewport",
            toolbarControls: [],
            draggable: false
          }
        },
        properties: {
          component: PropertiesPanelContainer,
          windowProps: {
            className: "propertiesPanel",
            title: "Properties",
            toolbarControls: [],
            draggable: false
          }
        },
        assetExplorer: {
          component: AssetExplorerPanelContainer,
          windowProps: {
            className: "assetExplorerPanel",
            title: "Asset Explorer",
            toolbarControls: [],
            draggable: false
          }
        }
      },
      DialogComponent: null,
      dialogProps: {},
      openModal: null,
      keyMap: {
        translateTool: "w",
        rotateTool: "e",
        scaleTool: "r",
        spaceTool: "x",
        snapTool: "t",
        delete: ["del", "backspace"],
        duplicate: ["ctrl+d", "command+d"],
        save: ["ctrl+s", "command+s"],
        saveAs: ["ctrl+shift+s", "command+shift+s"],
        undo: ["ctrl+z", "command+z"],
        redo: ["ctrl+shift+z", "command+shift+z"]
      },
      menus: [
        {
          name: "File",
          items: [
            {
              name: "New Scene",
              action: e => this.onNewScene(e)
            },
            {
              name: "Save Scene",
              action: e => this.onSave(e)
            },
            {
              name: "Save Scene As...",
              action: e => this.onSaveAs(e)
            },
            {
              name: "Export Scene...",
              action: e => this.onExportScene(e)
            },
            {
              name: "Open Project Directory",
              action: () => this.props.editor.project.openProjectDirectory()
            }
          ]
        },
        {
          name: "Help",
          items: [
            {
              name: "Getting Started",
              action: () => window.open("https://github.com/MozillaReality/spoke/wiki/Getting-Started")
            },
            {
              name: "Tutorials",
              action: () => window.open("https://github.com/MozillaReality/spoke/wiki/Tutorials")
            },
            {
              name: "Keyboard Shortcuts",
              action: () => window.open("https://github.com/MozillaReality/spoke/wiki/Keyboard-Shortcuts")
            }
          ]
        }
      ],
      globalHotKeyHandlers: {
        undo: this.onUndo,
        redo: this.onRedo,
        delete: this.onDelete,
        save: this.onSave,
        saveAs: this.onSaveAs
      }
    };
  }

  componentDidMount() {
    this.props.editor.signals.windowResize.dispatch();
    this.props.editor.signals.sceneModified.add(this.onSceneModified);

    window.onbeforeunload = e => {
      if (!this.props.editor.sceneModified()) {
        return undefined;
      }

      const dialogText = "Your scene has unsaved changes, are you sure you wish to navigate away from the page?";
      e.returnValue = dialogText;
      return dialogText;
    };
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize, false);
  }

  onWindowResize = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  onPanelChange = () => {
    this.props.editor.signals.windowResize.dispatch();
  };

  /**
   *  Dialog Context
   */

  showDialog = (DialogComponent, dialogProps = {}) => {
    this.setState({
      DialogComponent,
      dialogProps
    });
  };

  hideDialog = () => {
    this.setState({
      DialogComponent: null,
      dialogProps: {}
    });
  };

  dialogContext = {
    showDialog: this.showDialog,
    hideDialog: this.hideDialog
  };

  onCloseModal = () => {
    this.setState({
      openModal: null
    });
  };

  /**
   *  Hotkey / Hamburger Menu Handlers
   */
  onUndo = () => {
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.props.editor.undo();
  };

  onRedo = () => {
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.props.editor.redo();
  };

  onDelete = e => {
    const el = document.activeElement;
    const nodeName = el.nodeName;
    const isInput = el.isContentEditable || nodeName === "INPUT" || nodeName === "SELECT" || nodeName === "TEXTAREA";
    if (!isInput) {
      e.preventDefault();
    }
  };

  onSave = async e => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    if (this.props.editor.sceneInfo.uri) {
      this.onSaveScene(this.props.editor.sceneInfo.uri);
    } else {
      this.onSaveSceneAsDialog();
    }
  };

  onSaveAs = e => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.onSaveSceneAsDialog();
  };

  onExportScene = e => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.onExportSceneDialog();
  };

  /**
   * Scene Event Handlers
   */

  onEditorError = e => {
    this.showDialog(ErrorDialog, {
      title: e.title || "Error",
      message: e.message || "There was an unknown error."
    });
  };

  onSceneModified = () => {
    const modified = this.props.editor.sceneModified() ? "*" : "";
    document.title = `Spoke - ${this.props.editor.scene.name}${modified}`;
  };

  /**
   *  Scene Actions
   */

  waitForFile(options) {
    return new Promise(resolve => {
      const props = Object.assign(
        {
          onConfirm: filePath => resolve(filePath),
          onCancel: () => {
            this.hideDialog();
            resolve(null);
          }
        },
        options
      );

      this.showDialog(FileDialog, props);
    });
  }

  waitForConfirm(options) {
    return new Promise(resolve => {
      const props = Object.assign(
        {
          onConfirm: () => {
            this.hideDialog();
            resolve(true);
          },
          onCancel: () => {
            this.hideDialog();
            resolve(false);
          }
        },
        options
      );

      this.showDialog(ConfirmDialog, props);
    });
  }

  confirmSceneChange = async () => {
    if (!this.props.editor.sceneModified()) {
      return true;
    }

    return this.waitForConfirm({
      title: "Unsaved Chages",
      message: "This scene has unsaved changes. Are you sure you leave without saving?"
    });
  };

  onNewScene = async () => {
    if (!(await this.confirmSceneChange())) return;
    this.props.editor.loadNewScene();
  };

  onOpenSceneDialog = async () => {
    const filePath = await this.waitForFile({
      title: "Open scene...",
      filters: [".scene"],
      extension: ".scene",
      confirmButtonLabel: "Open"
    });

    if (filePath === null) return;

    await this.onOpenScene(filePath);
  };

  onOpenScene = async uri => {
    if (this.props.editor.sceneInfo.uri === uri) return;
    if (!this.confirmSceneChange()) return;

    this.showDialog(ProgressDialog, {
      title: "Opening Scene",
      message: "Opening scene..."
    });

    try {
      await this.props.editor.openScene(uri);
      this.hideDialog();
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error opening scene.",
        message: e.message || "There was an error when opening the scene."
      });
    }
  };

  onSaveSceneAsDialog = async () => {
    const filePath = await this.waitForFile({
      title: "Save scene as...",
      filters: [".scene"],
      extension: ".scene",
      confirmButtonLabel: "Save",
      initialPath: this.props.editor.sceneInfo.uri
    });

    if (filePath === null) return;

    await this.onSaveScene(filePath);
  };

  onSaveScene = async sceneURI => {
    this.showDialog(ProgressDialog, {
      title: "Saving Scene",
      message: "Saving scene..."
    });

    try {
      await this.props.editor.saveScene(sceneURI);
      this.hideDialog();
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error Saving Scene",
        message: e.message || "There was an error when saving the scene."
      });
    }
  };

  onExtendScene = async uri => {
    if (!(await this.confirmSceneChange())) return;

    this.showDialog(ProgressDialog, {
      title: "Extending Prefab",
      message: "Extending prefab..."
    });

    try {
      await this.props.editor.extendScene(uri);
      this.hideDialog();
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error extending prefab.",
        message: e.message || "There was an error when extending the prefab."
      });
    }
  };

  onEditPrefab = async (object, path) => {
    this.showDialog(ProgressDialog, {
      title: "Opening Prefab",
      message: "Opening prefab..."
    });

    try {
      await this.props.editor.editScenePrefab(object, path);
      this.hideDialog();
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error opening prefab.",
        message: e.message || "There was an error when opening the prefab."
      });
    }
  };

  onPopScene = async () => {
    if (!(await this.confirmSceneChange())) return;
    this.props.editor.popScene();
  };

  onCreatePrefabFromGLTF = async gltfPath => {
    try {
      const initialPath = getUrlDirname(gltfPath);
      const defaultFileName = getUrlFilename(gltfPath);

      const outputPath = await this.waitForFile({
        title: "Save prefab as...",
        filters: [".scene"],
        extension: ".scene",
        confirmButtonLabel: "Create Prefab",
        initialPath,
        defaultFileName
      });

      if (!outputPath) return null;

      this.showDialog(ProgressDialog, {
        title: "Creating Prefab",
        message: "Creating prefab..."
      });

      await this.props.editor.createPrefabFromGLTF(gltfPath, outputPath);

      this.hideDialog();

      return outputPath;
    } catch (e) {
      if (e instanceof ConflictError) {
        const result = await this.waitForConfirm({
          title: "Resolve Node Conflicts",
          message:
            "We've found duplicate and/or missing node names in this file.\nWould you like to fix all conflicts?\n*This will modify the original file."
        });

        if (!result) return null;

        if (await this.props.editor.fixConflictError(e)) {
          return this.onCreatePrefabFromGLTF(gltfPath);
        }
      }

      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error Creating Prefab",
        message: e.message || "There was an error when creating the prefab."
      });

      return null;
    }
  };

  onExportSceneDialog = async () => {
    const outputPath = await this.waitForFile({
      title: "Select the output directory",
      directory: true,
      defaultFileName: this.props.editor.scene.name + "-Exported",
      confirmButtonLabel: "Export scene"
    });

    if (outputPath === null) return;

    this.showDialog(ProgressDialog, {
      title: "Exporting Scene",
      message: "Exporting scene..."
    });

    try {
      await this.props.editor.exportScene(outputPath);
      this.hideDialog();
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error Exporting Scene",
        message: e.message || "There was an error when exporting the scene."
      });
    }
  };

  onWriteFiles = async (uploadPath, files) => {
    this.showDialog(ProgressDialog, {
      title: "Copying files",
      message: "Copying files..."
    });

    try {
      this.props.editor.project.writeFiles(uploadPath, files);
      this.hideDialog();
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error copying files",
        message: e.message || "There was an error when copying the files to the project."
      });
    }
  };

  sceneActionsContext = {
    onNewScene: this.onNewScene,
    onOpenSceneDialog: this.onOpenSceneDialog,
    onOpenScene: this.onOpenScene,
    onSaveSceneAsDialog: this.onSaveSceneAsDialog,
    onSaveScene: this.onSaveScene,
    onExtendScene: this.onExtendScene,
    onEditPrefab: this.onEditPrefab,
    onPopScene: this.onPopScene,
    onCreatePrefabFromGLTF: this.onCreatePrefabFromGLTF,
    onExportSceneDialog: this.onExportSceneDialog,
    onWriteFiles: this.onWriteFiles
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
    const { openModal, menus, DialogComponent, dialogProps } = this.state;

    const { initialPanels, editor } = this.props;

    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <HotKeys keyMap={this.state.keyMap} handlers={this.state.globalHotKeyHandlers} className={styles.flexColumn}>
          <EditorContextProvider value={editor}>
            <DialogContextProvider value={this.dialogContext}>
              <SceneActionsContextProvider value={this.sceneActionsContext}>
                <ToolBar menus={menus} editor={editor} />
                <MosaicWithoutDragDropContext
                  className="mosaic-theme"
                  renderTile={this.renderPanel}
                  initialValue={initialPanels}
                  onChange={this.onPanelChange}
                />
                <Modal
                  ariaHideApp={false}
                  isOpen={!!openModal}
                  onRequestClose={this.onCloseModal}
                  shouldCloseOnOverlayClick={openModal && openModal.shouldCloseOnOverlayClick}
                  className="Modal"
                  overlayClassName="Overlay"
                >
                  {openModal && <openModal.component {...openModal.props} />}
                </Modal>
                <Modal
                  ariaHideApp={false}
                  isOpen={!!DialogComponent}
                  onRequestClose={this.hideDialog}
                  shouldCloseOnOverlayClick={false}
                  className="Modal"
                  overlayClassName="Overlay"
                >
                  {DialogComponent && <DialogComponent {...dialogProps} hideDialog={this.hideDialog} />}
                </Modal>
              </SceneActionsContextProvider>
            </DialogContextProvider>
          </EditorContextProvider>
        </HotKeys>
      </DragDropContextProvider>
    );
  }
}

export default EditorContainer;
