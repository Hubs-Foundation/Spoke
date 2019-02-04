import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "@mozillareality/react-dnd-html5-backend";
import { MosaicWindow, MosaicWithoutDragDropContext } from "react-mosaic-component";
import { HotKeys } from "react-hotkeys";
import Modal from "react-modal";

import "./styles/global.scss";
import styles from "./styles/common.scss";

import ToolBar from "./toolbar/ToolBar";

import HierarchyPanelContainer from "./hierarchy/HierarchyPanelContainer";
import PropertiesPanelContainer from "./properties/PropertiesPanelContainer";
import ViewportPanelContainer from "./viewport/ViewportPanelContainer";

import { EditorContextProvider } from "./contexts/EditorContext";
import { DialogContextProvider } from "./contexts/DialogContext";
import { SceneActionsContextProvider } from "./contexts/SceneActionsContext";

import ConfirmDialog from "./dialogs/ConfirmDialog";
import ErrorDialog from "./dialogs/ErrorDialog";
import FileDialog from "./dialogs/FileDialog";
import LoginDialog from "./dialogs/LoginDialog";
import ProgressDialog from "./dialogs/ProgressDialog";
import PublishDialog from "./dialogs/PublishDialog";
import UpdateRequiredDialog from "./dialogs/UpdateRequiredDialog";

import AuthenticationError from "../api/AuthenticationError";

function isInputSelected() {
  const el = document.activeElement;
  const nodeName = el.nodeName;
  return el.isContentEditable || nodeName === "INPUT" || nodeName === "SELECT" || nodeName === "TEXTAREA";
}

class App extends Component {
  static propTypes = {
    editor: PropTypes.object
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", this.onWindowResize, false);

    let dialogProps = {};
    let DialogComponent = null;

    if (props.editor.project.updateInfo.updateRequired) {
      DialogComponent = UpdateRequiredDialog;
      dialogProps = props.editor.project.updateInfo;
    }

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
        }
      },
      initialPanels: {
        direction: "row",
        first: "viewport",
        second: {
          direction: "column",
          first: "hierarchy",
          second: "properties",
          splitPercentage: 50
        },
        splitPercentage: 75
      },
      DialogComponent,
      dialogProps,
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
      toolbarMenu: this.generateToolbarMenu()
    };
  }

  generateToolbarMenu = () => {
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
          this.props.editor.sceneUri
            ? {
                name: "Save " + this.props.editor.project.getUrlFilename(this.props.editor.sceneUri),
                action: e => this.onSave(e)
              }
            : null,
          {
            name: "Save Scene As...",
            action: e => this.onSaveAs(e)
          },
          {
            name: "Publish to Hubs...",
            action: () => this.onPublishScene()
          },
          {
            name: "Export as glTF ...",
            action: e => this.onExportScene(e)
          },
          {
            name: "Export as binary glTF (.glb) ...",
            action: e => this.onExportScene(e, true)
          },
          {
            name: "Open Scenes Folder...",
            action: () => this.props.editor.project.openProjectDirectory()
          }
        ].filter(x => x !== null)
      },
      {
        name: "Help",
        items: [
          {
            name: "Keyboard and Mouse Controls",
            action: () => window.open("https://github.com/MozillaReality/Spoke/wiki/Keyboard-and-Mouse-Controls")
          },
          {
            name: "Get Support",
            action: () => window.open("https://github.com/MozillaReality/Spoke/blob/master/SUPPORT.md")
          },
          {
            name: "Report an Issue",
            action: () => window.open("https://github.com/MozillaReality/Spoke/issues")
          },
          {
            name: "Join us on Discord",
            action: () => window.open("https://discord.gg/XzrGUY8")
          }
        ]
      }
    ];
  };

  componentDidMount() {
    this.props.editor.project.watch();
    this.props.editor.signals.windowResize.dispatch();
    this.props.editor.signals.sceneModified.add(this.onSceneModified);
    this.props.editor.signals.editorError.add(this.onEditorError);

    this.onPopState();

    this.updateDocumentTitle();

    window.onbeforeunload = e => {
      if (!this.props.editor.sceneModified) {
        return undefined;
      }

      const dialogText = `${
        this.props.editor.scene.name
      } has unsaved changes, are you sure you wish to navigate away from the page?`;
      e.returnValue = dialogText;
      return dialogText;
    };

    window.addEventListener("popstate", this.onPopState);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize, false);
  }

  onPopState = () => {
    const pathname = window.location.pathname;

    if (pathname.startsWith("/scenes")) {
      const scenePath = "/api/files" + pathname.replace(/^\/scenes/, "") + ".spoke";
      this.onOpenScene(scenePath, true);
    } else {
      this.props.editor.loadNewScene();
    }
  };

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

  onExportScene = (e, glb) => {
    e.preventDefault();

    // Disable when dialog is shown.
    if (this.state.DialogComponent !== null) {
      return;
    }

    this.onExportSceneDialog(glb);
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
    this.setState({ toolbarMenu: this.generateToolbarMenu() });
  };

  updateDocumentTitle = () => {
    const modified = this.props.editor.sceneModified ? "*" : "";
    document.title = `${modified}${this.props.editor.scene.name} | Spoke by Mozilla`;
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
    if (!this.props.editor.sceneModified) {
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
    history.pushState(null, "Spoke by Mozilla", "/");
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

  onOpenScene = async (uri, skipPushState) => {
    if (!(await this.confirmSceneChange())) {
      this.hideDialog();
      return;
    }

    if (!skipPushState) {
      const scenePath = uri.replace(/^\/api\/files/, "\\scenes").replace(".spoke", "");
      const pageTitle = "Spoke by Mozilla";
      history.pushState(null, pageTitle, scenePath);
    }

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
    if (this.props.editor.sceneUri) {
      return this.onSaveScene(this.props.editor.sceneUri);
    } else {
      return this.onSaveSceneAsDialog();
    }
  };

  onSaveSceneAsDialog = async () => {
    const initialPath = this.props.editor.sceneUri;

    const filePath = await this.waitForFile({
      title: "Save scene as...",
      filters: [".spoke"],
      extension: ".spoke",
      confirmButtonLabel: "Save",
      initialPath: this.props.editor.sceneUri
    });

    if (filePath === null) return false;

    const newScenePath = filePath !== initialPath;

    if (newScenePath) {
      // When we save the scene to a new file, clear the metadata
      // used for publishing so it ends up as a new scene in Hubs.
      this.props.editor.clearSceneMetadata();
    }

    await this.onSaveScene(filePath);

    const scenePath = filePath.replace(/^\/api\/files/, "\\scenes").replace(".spoke", "");
    const pageTitle = "Spoke by Mozilla";
    history.pushState(null, pageTitle, scenePath);
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

  onExportSceneDialog = async glb => {
    const { editor } = this.props;
    const scene = editor.scene;
    const fileName = glb ? scene.name + ".glb" : scene.name + "-Exported";

    const outputPath = await this.waitForFile({
      title: "Select the output directory",
      directory: !glb,
      defaultFileName: fileName,
      confirmButtonLabel: "Export scene"
    });

    if (outputPath === null) return;

    this.showDialog(ProgressDialog, {
      title: "Exporting Scene",
      message: "Exporting scene..."
    });

    try {
      const glbBlob = await this.props.editor.exportScene(outputPath, glb);

      if (glb) {
        await this.props.editor.project.writeBlob(outputPath, glbBlob);
      }

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
    if (this.props.editor.sceneModified) {
      const willSaveChanges = await this.waitForConfirm({
        title: "Unsaved Chages",
        message: "Your scene must be saved before publishing.",
        confirmLabel: "Save"
      });

      if (!willSaveChanges) return;

      const savedOk = await this.saveOrSaveAsScene();
      if (!savedOk) return;
    }

    if (await this.props.editor.project.authenticated()) {
      this._showPublishDialog();
    } else {
      this._showLoginDialog();
    }
  };

  _showLoginDialog = () => {
    this.showDialog(LoginDialog, {
      onLogin: async email => {
        const { authComplete } = await this.props.editor.project.startAuthentication(email);
        this.showDialog(LoginDialog, { authStarted: true });
        await authComplete;
        this._showPublishDialog();
      }
    });
  };

  _showPublishDialog = async () => {
    const {
      blob: screenshotBlob,
      cameraTransform: screenshotCameraTransform
    } = await this.props.editor.takeScreenshot();
    const contentAttributions = this.props.editor.getSceneContentAttributions();
    const screenshotURL = URL.createObjectURL(screenshotBlob);
    const {
      name,
      creatorAttribution,
      description,
      allowRemixing,
      allowPromotion,
      sceneId
    } = this.props.editor.getSceneMetadata();

    let initialCreatorAttribution = creatorAttribution;
    if (!initialCreatorAttribution || initialCreatorAttribution.length === 0) {
      initialCreatorAttribution = (await this.props.editor.project.getUserInfo()).creatorAttribution;
    }

    await this.showDialog(PublishDialog, {
      screenshotURL,
      contentAttributions,
      initialName: name || this.props.editor.scene.name,
      initialCreatorAttribution,
      initialDescription: description,
      initialAllowRemixing: allowRemixing,
      initialAllowPromotion: allowPromotion,
      isNewScene: !sceneId,
      onCancel: () => {
        URL.revokeObjectURL(screenshotURL);
        this.hideDialog();
      },
      onPublish: async ({ name, creatorAttribution, description, allowRemixing, allowPromotion, isNewScene }) => {
        this.showDialog(ProgressDialog, {
          title: "Publishing Scene",
          message: "Publishing scene..."
        });

        this.props.editor.setSceneMetadata({
          name,
          creatorAttribution,
          description,
          allowRemixing,
          allowPromotion,
          previewCameraTransform: screenshotCameraTransform
        });

        await this.props.editor.project.setUserInfo({ creatorAttribution });

        let publishResult;
        try {
          publishResult = await this.props.editor.publishScene(
            isNewScene ? null : sceneId,
            screenshotBlob,
            contentAttributions,
            publishProgress => {
              this.showDialog(ProgressDialog, {
                title: "Publishing Scene",
                message: `Publishing scene${publishProgress ? ` [${publishProgress}]` : ""}...`
              });
            }
          );

          this.props.editor.setSceneMetadata({ sceneUrl: publishResult.sceneUrl, sceneId: publishResult.sceneId });

          await this.saveOrSaveAsScene();

          this.showDialog(PublishDialog, {
            screenshotURL,
            initialName: name,
            initialCreatorAttribution: creatorAttribution,
            published: true,
            sceneUrl: publishResult.sceneUrl
          });
        } catch (e) {
          console.error(e);
          if (e instanceof AuthenticationError) {
            this._showLoginDialog();
          } else {
            this.showDialog(ErrorDialog, {
              title: "Error Publishing Scene",
              message: e.message || "There was an unknown error."
            });
          }
        } finally {
          URL.revokeObjectURL(screenshotURL);
        }
      }
    });
  };

  sceneActionsContext = {
    onNewScene: this.onNewScene,
    onOpenSceneDialog: this.onOpenSceneDialog,
    onOpenScene: this.onOpenScene,
    onSaveSceneAsDialog: this.onSaveSceneAsDialog,
    onSaveScene: this.onSaveScene,
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
    const { openModal, toolbarMenu, DialogComponent, dialogProps } = this.state;

    const { editor } = this.props;

    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <HotKeys keyMap={this.state.keyMap} handlers={this.state.globalHotKeyHandlers} className={styles.flexColumn}>
          <EditorContextProvider value={editor}>
            <DialogContextProvider value={this.dialogContext}>
              <SceneActionsContextProvider value={this.sceneActionsContext}>
                <ToolBar menu={toolbarMenu} editor={editor} sceneActions={this.sceneActionsContext} />
                <MosaicWithoutDragDropContext
                  className="mosaic-theme"
                  renderTile={this.renderPanel}
                  initialValue={this.state.initialPanels}
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

export default App;
