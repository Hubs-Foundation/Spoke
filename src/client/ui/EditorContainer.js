import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "@mozillareality/react-dnd-html5-backend";
import { MosaicWindow } from "react-mosaic-component";
import { HotKeys } from "react-hotkeys";
import Modal from "react-modal";
import { MosaicWithoutDragDropContext } from "react-mosaic-component";

import ToolBar from "./menus/ToolBar";
import AssetExplorerPanelContainer from "./panels/AssetExplorerPanelContainer";
import HierarchyPanelContainer from "./panels/HierarchyPanelContainer";
import PropertiesPanelContainer from "./panels/PropertiesPanelContainer";
import ViewportPanelContainer from "./panels/ViewportPanelContainer";
import { EditorContextProvider } from "./contexts/EditorContext";
import { DialogContextProvider } from "./contexts/DialogContext";
import { SceneActionsContextProvider } from "./contexts/SceneActionsContext";
import styles from "../common.scss";
import ConfirmDialog from "./dialogs/ConfirmDialog";
import ErrorDialog from "./dialogs/ErrorDialog";
import FileDialog from "./dialogs/FileDialog";
import LoginDialog from "./dialogs/LoginDialog";
import PublishDialog from "./dialogs/PublishDialog";
import ProgressDialog from "./dialogs/ProgressDialog";
import ConflictError from "../editor/ConflictError";
import { getUrlDirname, getUrlFilename } from "../utils/url-path";

function isInputSelected() {
  const el = document.activeElement;
  const nodeName = el.nodeName;
  return el.isContentEditable || nodeName === "INPUT" || nodeName === "SELECT" || nodeName === "TEXTAREA";
}

class EditorContainer extends Component {
  static initialPanels = {
    basic: {
      direction: "row",
      first: {
        direction: "column",
        first: "hierarchy",
        second: "properties",
        splitPercentage: 50
      },
      second: "viewport",
      splitPercentage: 25
    },

    advanced: {
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
    editor: PropTypes.object,
    uiMode: PropTypes.string
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
        spaceTool: "d",
        snapTool: "s",
        focusSelection: "f",
        delete: ["del", "backspace"],
        duplicate: ["ctrl+d", "command+d"],
        save: ["ctrl+s", "command+s"],
        saveAs: ["ctrl+shift+s", "command+shift+s"],
        open: ["ctrl+o", "command+o"],
        undo: ["ctrl+z", "command+z"],
        redo: ["ctrl+shift+z", "command+shift+z"]
      },
      globalHotKeyHandlers: {
        undo: this.onUndo,
        redo: this.onRedo,
        delete: this.onDelete,
        save: this.onSave,
        saveAs: this.onSaveAs,
        open: this.onOpen,
        translateTool: this.onTranslateTool,
        rotateTool: this.onRotateTool,
        scaleTool: this.onScaleTool,
        focusSelection: this.onFocusSelection,
        duplicate: this.onDuplicate,
        snapTool: this.onSnapTool,
        spaceTool: this.onSpaceTool
      },
      menus: this.generateMenus()
    };
  }

  generateMenus = () => {
    return [
      {
        name: "File",
        items: [
          {
            name: "New Scene",
            action: e => this.onNewScene(e)
          },
          {
            name: "Open Scene...",
            action: e => this.onOpenSceneDialog(e)
          },
          this.props.editor.sceneInfo.uri
            ? {
                name: "Save " + getUrlFilename(this.props.editor.sceneInfo.uri),
                action: e => this.onSave(e)
              }
            : null,
          {
            name: "Save Scene As...",
            action: e => this.onSaveAs(e)
          },
          {
            name: "Export to GLTF...",
            action: e => this.onExportScene(e)
          },
          {
            name: "Generate Nav Mesh",
            action: e => this.onGenerateNavMesh(e)
          },
          {
            name: "Open Project Folder...",
            action: () => this.props.editor.project.openProjectDirectory()
          }
        ].filter(x => x !== null)
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
    ];
  };

  componentDidMount() {
    this.props.editor.signals.windowResize.dispatch();
    this.props.editor.signals.sceneModified.add(this.onSceneModified);
    this.props.editor.signals.editorError.add(this.onEditorError);
    this.updateDocumentTitle();

    window.onbeforeunload = e => {
      if (!this.props.editor.sceneModified()) {
        return undefined;
      }

      const dialogText = `${
        this.props.editor.scene.name
      } has unsaved changes, are you sure you wish to navigate away from the page?`;
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

  onSave = async e => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    return this.saveOrSaveAsScene();
  };

  onSaveAs = e => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.onSaveSceneAsDialog();
  };

  onOpen = e => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.onOpenSceneDialog();
  };

  onExportScene = e => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.onExportSceneDialog();
  };

  onGenerateNavMesh = async e => {
    e.preventDefault();

    this.showDialog(ProgressDialog, {
      title: "Generating Nav Mesh",
      message: "Generating nav mesh..."
    });

    try {
      await this.props.editor.generateNavMesh();
      this.hideDialog();
    } catch (e) {
      console.error(e);
      this.showDialog(ErrorDialog, {
        title: "Error Generating Nav Mesh",
        message: e.message || "There was an unknown error."
      });
    }
  };

  onTranslateTool = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.signals.transformModeChanged.dispatch("translate");
  };

  onRotateTool = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.signals.transformModeChanged.dispatch("rotate");
  };

  onScaleTool = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.signals.transformModeChanged.dispatch("scale");
  };

  onFocusSelection = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.focusSelection();
  };

  onDuplicate = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.duplicateSelectedObject();
    return false;
  };

  onDelete = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.deleteSelectedObject();
  };

  onSnapTool = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.signals.snapToggled.dispatch();
  };

  onSpaceTool = e => {
    if (isInputSelected()) {
      return true;
    }

    e.preventDefault();
    this.props.editor.signals.spaceChanged.dispatch();
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
    this.updateDocumentTitle();
    this.setState({ menus: this.generateMenus() });
  };

  updateDocumentTitle = () => {
    const modified = this.props.editor.sceneModified() ? "*" : "";
    document.title = `${modified}${this.props.editor.scene.name} - Spoke by Mozilla`;
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
      filters: [".spoke"],
      extension: ".spoke",
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

  saveOrSaveAsScene = async () => {
    if (this.props.editor.sceneInfo.uri) {
      return this.onSaveScene(this.props.editor.sceneInfo.uri);
    } else {
      return this.onSaveSceneAsDialog();
    }
  };

  onSaveSceneAsDialog = async () => {
    const initialPath = this.props.editor.sceneInfo.uri;

    const filePath = await this.waitForFile({
      title: "Save scene as...",
      filters: [".spoke"],
      extension: ".spoke",
      confirmButtonLabel: "Save",
      initialPath: this.props.editor.sceneInfo.uri
    });

    if (filePath === null) return false;

    const newScenePath = filePath !== initialPath;

    if (newScenePath) {
      // When we save the scene to a new file, clear the metadata
      // used for publishing so it ends up as a new scene in Hubs.
      this.props.editor.clearSceneMetadata();
    }

    return await this.onSaveScene(filePath);
  };

  onSaveScene = async sceneURI => {
    this.showDialog(ProgressDialog, {
      title: "Saving Scene",
      message: "Saving scene..."
    });

    try {
      await this.props.editor.saveScene(sceneURI);
      this.hideDialog();

      return true;
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error Saving Scene",
        message: e.message || "There was an error when saving the scene."
      });

      return false;
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
        filters: [".spoke"],
        extension: ".spoke",
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

  onPublishScene = async () => {
    if (await this.props.editor.authenticated()) {
      if (this.props.editor.sceneModified()) {
        const willSaveChanges = await this.waitForConfirm({
          title: "Unsaved Chages",
          message: "Your scene has unsaved changes, you'll need to save before publishing."
        });

        if (!willSaveChanges) return;

        const savedOk = await this.saveOrSaveAsScene();
        if (!savedOk) return;
      }

      this._showPublishDialog();
    } else {
      this.showDialog(LoginDialog, {
        onLogin: async email => {
          const { authComplete } = await this.props.editor.startAuthentication(email);
          this.showDialog(LoginDialog, { authStarted: true });
          await authComplete;
          this._showPublishDialog();
        },
        onCancel: () => this.hideDialog()
      });
    }
  };

  _showPublishDialog = async () => {
    const screenshotBlob = await this.props.editor.takeScreenshot();
    const attribution = this.props.editor.getSceneAttribution();
    const screenshotURL = URL.createObjectURL(screenshotBlob);
    const { name, description, sceneId } = this.props.editor.getSceneMetadata();

    await this.showDialog(PublishDialog, {
      screenshotURL,
      attribution,
      initialName: name || this.props.editor.scene.name,
      initialDescription: description,
      isNewScene: !sceneId,
      onCancel: () => {
        URL.revokeObjectURL(screenshotURL);
        this.hideDialog();
      },
      onPublish: async ({ name, description, isNewScene }) => {
        this.showDialog(ProgressDialog, {
          title: "Publishing Scene",
          message: "Publishing scene..."
        });

        this.props.editor.setSceneMetadata({ name, description });

        const publishResult = await this.props.editor.publishScene(
          isNewScene ? null : sceneId,
          screenshotBlob,
          attribution
        );
        this.props.editor.setSceneMetadata({ sceneUrl: publishResult.sceneUrl, sceneId: publishResult.sceneId });

        await this.saveOrSaveAsScene();

        await this.showDialog(PublishDialog, {
          screenshotURL,
          initialName: name,
          published: true,
          sceneUrl: publishResult.sceneUrl
        });

        URL.revokeObjectURL(screenshotURL);
      }
    });
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
    onPublishScene: this.onPublishScene,
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

    const { editor } = this.props;

    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <HotKeys keyMap={this.state.keyMap} handlers={this.state.globalHotKeyHandlers} className={styles.flexColumn}>
          <EditorContextProvider value={editor}>
            <DialogContextProvider value={this.dialogContext}>
              <SceneActionsContextProvider value={this.sceneActionsContext}>
                <ToolBar
                  menus={menus}
                  editor={editor}
                  sceneActions={this.sceneActionsContext}
                  mayPublish={editor.sceneSaved()}
                />
                <MosaicWithoutDragDropContext
                  className="mosaic-theme"
                  renderTile={this.renderPanel}
                  initialValue={EditorContainer.initialPanels[this.props.uiMode]}
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
