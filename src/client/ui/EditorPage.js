import React, { Component } from "react";
import PropTypes from "prop-types";
import { MosaicWindow, Mosaic } from "react-mosaic-component";
import { HotKeys } from "react-hotkeys";
import Modal from "react-modal";
import { Prompt } from "react-router-dom";
import DocumentTitle from "react-document-title";

import styles from "./styles/common.scss";

import ToolBar from "./toolbar/ToolBar";

import HierarchyPanelContainer from "./hierarchy/HierarchyPanelContainer";
import PropertiesPanelContainer from "./properties/PropertiesPanelContainer";
import ViewportPanelContainer from "./viewport/ViewportPanelContainer";

import { defaultSettings, SettingsContextProvider } from "./contexts/SettingsContext";
import { EditorContextProvider } from "./contexts/EditorContext";
import { DialogContextProvider } from "./contexts/DialogContext";

import ConfirmDialog from "./dialogs/ConfirmDialog";
import ErrorDialog from "./dialogs/ErrorDialog";
import LoginDialog from "./dialogs/LoginDialog";
import ProgressDialog from "./dialogs/ProgressDialog";
import PublishDialog from "./dialogs/PublishDialog";
import UpdateRequiredDialog from "./dialogs/UpdateRequiredDialog";

import AuthenticationError from "../api/AuthenticationError";
import TextInputDialog from "./dialogs/TextInputDialog";

function isInputSelected() {
  const el = document.activeElement;
  const nodeName = el.nodeName;
  return el.isContentEditable || nodeName === "INPUT" || nodeName === "SELECT" || nodeName === "TEXTAREA";
}

export default class EditorPage extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
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

    let settings = defaultSettings;
    const storedSettings = localStorage.getItem("spoke-settings");
    if (storedSettings) {
      settings = JSON.parse(storedSettings);
    }

    this.state = {
      settingsContext: {
        settings,
        updateSetting: this.updateSetting
      },
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
      }
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
            action: e => this.onOpen(e)
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
      },
      {
        name: "Developer",
        items: [
          {
            name: this.state.settingsContext.settings.enableExperimentalFeatures
              ? "Disable Experimental Features"
              : "Enable Experimental Features",
            action: () =>
              this.updateSetting(
                "enableExperimentalFeatures",
                !this.state.settingsContext.settings.enableExperimentalFeatures
              )
          }
        ]
      }
    ];
  };

  componentDidMount() {
    this.props.editor.signals.windowResize.dispatch();
    this.props.editor.signals.sceneModified.add(this.onSceneModified);
    this.props.editor.signals.editorError.add(this.onEditorError);
    this.props.editor.signals.viewportInitialized.add(this.onViewportInitialized);
  }

  onViewportInitialized = () => {
    const { projectId } = this.props.match.params;
    this.loadProject(projectId);
  };

  componentDidUpdate(prevProps) {
    const { projectId } = this.props.match.params;
    const { projectId: prevProjectId } = prevProps.match.params;

    if (projectId !== prevProjectId && this.props.editor.viewport) {
      this.loadProject(projectId);
    }
  }

  async loadProject(projectId) {
    if (projectId === "new") {
      this.props.editor.loadNewScene();
    } else {
      const scenePath = "/api/files/" + projectId + ".spoke";

      this.showDialog(ProgressDialog, {
        title: "Opening Scene",
        message: "Opening scene..."
      });

      try {
        await this.props.editor.openScene(scenePath);
        this.hideDialog();
      } catch (e) {
        console.error(e);

        this.showDialog(ErrorDialog, {
          title: "Error opening scene.",
          message: e.message || "There was an error when opening the scene."
        });
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize, false);
    this.props.editor.signals.sceneModified.remove(this.onSceneModified);
    this.props.editor.signals.editorError.remove(this.onEditorError);
    this.props.editor.signals.viewportInitialized.remove(this.onViewportInitialized);
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

  onOpen = e => {
    e.preventDefault();
    this.props.history.push("/projects");
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
    this.setState({ toolbarMenu: this.generateToolbarMenu() });
  };

  updateSetting(key, value) {
    const settings = Object.assign(this.state.settingsContext.settings, { [key]: value });
    localStorage.setItem("spoke-settings", JSON.stringify(settings));
    this.setState({
      settingsContext: {
        ...this.state.settingsContext,
        settings
      }
    });
  }

  /**
   *  Scene Actions
   */

  waitForInput(options) {
    return new Promise(resolve => {
      const props = Object.assign(
        {
          onConfirm: value => resolve(value),
          onCancel: () => {
            this.hideDialog();
            resolve(null);
          }
        },
        options
      );

      this.showDialog(TextInputDialog, props);
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

  onNewScene = async () => {
    this.props.history.push("/projects/new");
  };

  saveOrSaveAsScene = async () => {
    if (this.props.editor.sceneUri) {
      return this.onSaveScene(this.props.editor.sceneUri);
    } else {
      return this.onSaveSceneAsDialog();
    }
  };

  onSaveSceneAsDialog = async () => {
    const scene = this.props.editor.scene;

    const fileName = await this.waitForInput({
      title: "Save scene as...",
      okLabel: "Save",
      message: "Enter a name for your scene",
      initialValue: scene.name
    });

    if (fileName === null) return false;

    if (fileName !== scene.name) {
      // When we save the scene to a new file, clear the metadata
      // used for publishing so it ends up as a new scene in Hubs.
      this.props.editor.clearSceneMetadata();
    }

    await this.onSaveScene(`/api/files/${fileName}.spoke`);

    this.props.history.push(`/projects/${fileName}`);
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

  onExportSceneDialog = async () => {
    this.showDialog(ProgressDialog, {
      title: "Exporting Scene",
      message: "Exporting scene..."
    });

    try {
      const editor = this.props.editor;

      const glbBlob = await editor.exportScene();

      this.hideDialog();

      const el = document.createElement("a");
      el.download = editor.scene.name + ".glb";
      el.href = URL.createObjectURL(glbBlob);
      el.click();
    } catch (e) {
      console.error(e);

      this.showDialog(ErrorDialog, {
        title: "Error Exporting Scene",
        message: e.message || "There was an error when exporting the scene."
      });
    }
  };

  onPublishScene = async () => {
    if (this.props.editor.sceneModified) {
      const willSaveChanges = await this.waitForConfirm({
        title: "Unsaved Changes",
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

  renderPanel = (panelId, path) => {
    const panel = this.state.registeredPanels[panelId];

    return (
      <MosaicWindow path={path} {...panel.windowProps}>
        <panel.component {...panel.props} />
      </MosaicWindow>
    );
  };

  render() {
    const { DialogComponent, dialogProps, settingsContext } = this.state;
    const { editor } = this.props;
    const toolbarMenu = this.generateToolbarMenu();

    const modified = this.props.editor.sceneModified ? "*" : "";

    return (
      <HotKeys keyMap={this.state.keyMap} handlers={this.state.globalHotKeyHandlers} className={styles.flexColumn}>
        <SettingsContextProvider value={settingsContext}>
          <EditorContextProvider value={editor}>
            <DialogContextProvider value={this.dialogContext}>
              <ToolBar menu={toolbarMenu} editor={editor} onPublishScene={this.onPublishScene} />
              <Mosaic
                className="mosaic-theme"
                renderTile={this.renderPanel}
                initialValue={this.state.initialPanels}
                onChange={this.onPanelChange}
              />
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
              <DocumentTitle title={`${modified}${this.props.editor.scene.name} | Spoke by Mozilla`} />
              <Prompt
                message={`${
                  editor.scene.name
                } has unsaved changes, are you sure you wish to navigate away from the page?`}
                when={editor.sceneModified}
              />
            </DialogContextProvider>
          </EditorContextProvider>
        </SettingsContextProvider>
      </HotKeys>
    );
  }
}
