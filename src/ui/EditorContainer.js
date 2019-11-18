import React, { Component } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Helmet } from "react-helmet";
import * as Sentry from "@sentry/browser";
import styled from "styled-components";
import { DndProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";

import ToolBar from "./toolbar/ToolBar";

import HierarchyPanelContainer from "./hierarchy/HierarchyPanelContainer";
import PropertiesPanelContainer from "./properties/PropertiesPanelContainer";
import ViewportPanelContainer from "./viewport/ViewportPanelContainer";

import { defaultSettings, SettingsContextProvider } from "./contexts/SettingsContext";
import { EditorContextProvider } from "./contexts/EditorContext";
import { DialogContextProvider } from "./contexts/DialogContext";
import { OnboardingContextProvider } from "./contexts/OnboardingContext";

import { createEditor } from "../config";

import ErrorDialog from "./dialogs/ErrorDialog";
import ProgressDialog from "./dialogs/ProgressDialog";
import ConfirmDialog from "./dialogs/ConfirmDialog";
import SaveNewProjectDialog from "./dialogs/SaveNewProjectDialog";
import ExportProjectDialog from "./dialogs/ExportProjectDialog";

import Onboarding from "./onboarding/Onboarding";
import SupportDialog from "./dialogs/SupportDialog";
import { cmdOrCtrlString } from "./utils";
import BrowserPrompt from "./router/BrowserPrompt";
import { Resizeable } from "./layout/Resizeable";
import DragLayer from "./dnd/DragLayer";
import Editor from "../editor/Editor";

const StyledEditorContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: fixed;
`;

const WorkspaceContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  margin: 6px;
`;

export default class EditorContainer extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    projectId: PropTypes.string,
    project: PropTypes.object,
    history: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    let settings = defaultSettings;
    const storedSettings = localStorage.getItem("spoke-settings");
    if (storedSettings) {
      settings = JSON.parse(storedSettings);
    }

    const editor = createEditor(props.api, settings);
    window.editor = editor;
    const editorInitPromise = editor.init();

    this.state = {
      editor,
      editorInitPromise,
      creatingProject: false,
      settingsContext: {
        settings,
        updateSetting: this.updateSetting
      },
      onboardingContext: {
        enabled: props.projectId === "tutorial"
      },
      DialogComponent: null,
      dialogProps: {},
      modified: false
    };
  }

  updateModifiedState = then => {
    const nextModified = this.state.editor.sceneModified && !this.state.creatingProject;

    if (nextModified !== this.state.modified) {
      this.setState({ modified: nextModified }, then);
    } else if (then) {
      then();
    }
  };

  generateToolbarMenu = () => {
    return [
      {
        name: "Back to Projects",
        action: this.onOpenProject
      },
      {
        name: "File",
        items: [
          {
            name: "New Project",
            action: this.onNewProject
          },
          {
            name: "Save Project",
            hotkey: `${cmdOrCtrlString} + S`,
            action: this.onSaveProject
          },
          {
            name: "Save As",
            action: this.onDuplicateProject
          },
          {
            name: "Publish to Hubs...",
            action: this.onPublishProject
          },
          {
            name: "Export as binary glTF (.glb) ...",
            action: this.onExportProject
          },
          {
            name: "Import legacy .spoke project",
            action: this.onImportLegacyProject
          },
          {
            name: "Export legacy .spoke project",
            action: this.onExportLegacyProject
          }
        ]
      },
      {
        name: "Help",
        items: [
          {
            name: "Tutorial",
            action: () => {
              if (this.props.projectId === "tutorial") {
                this.setState({ onboardingContext: { enabled: true } });
              } else {
                this.props.history.push("/projects/tutorial");
              }
            }
          },
          {
            name: "Keyboard and Mouse Controls",
            action: () => window.open("https://github.com/mozilla/Spoke/wiki/Keyboard-and-Mouse-Controls")
          },
          {
            name: "Get Support",
            action: () => this.showDialog(SupportDialog)
          },
          {
            name: "Submit Feedback",
            action: () => window.open("https://forms.gle/2PAFXKwW1SXdfSK17")
          },
          {
            name: "Report an Issue",
            action: () => window.open("https://github.com/mozilla/Spoke/issues/new")
          },
          {
            name: "Join us on Discord",
            action: () => window.open("https://discord.gg/wHmY4nd")
          },
          {
            name: "Terms of Use",
            action: () => window.open("https://github.com/mozilla/hubs/blob/master/TERMS.md")
          },
          {
            name: "Privacy Notice",
            action: () => window.open("https://github.com/mozilla/hubs/blob/master/PRIVACY.md")
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
      },
      {
        name: "Submit Feedback",
        action: () => window.open("https://forms.gle/2PAFXKwW1SXdfSK17")
      }
    ];
  };

  componentDidMount() {
    this.showDialog(ProgressDialog, {
      title: "Loading Project",
      message: "Loading project..."
    });

    const editor = this.state.editor;
    editor.addListener("initialized", this.onEditorInitialized);
    editor.addListener("error", this.onEditorError);
  }

  onEditorInitialized = () => {
    const editor = this.state.editor;

    const gl = this.state.editor.renderer.renderer.context;

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    let webglVendor = "Unknown";
    let webglRenderer = "Unknown";

    if (debugInfo) {
      webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    Sentry.configureScope(scope => {
      scope.setTag("webgl-vendor", webglVendor);
      scope.setTag("webgl-renderer", webglRenderer);
    });

    this.loadProject(this.props.project).catch(console.error);
    window.addEventListener("resize", this.onResize);
    this.onResize();
    editor.addListener("projectLoaded", this.onProjectLoaded);
    editor.addListener("sceneModified", this.onSceneModified);
    editor.addListener("saveProject", this.onSaveProject);
  };

  componentDidUpdate(prevProps) {
    if (this.props.project !== prevProps.project) {
      const editor = this.state.editor;

      if (editor.initialized) {
        this.loadProject(this.props.project).catch(console.error);
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);

    const editor = this.state.editor;
    editor.removeListener("sceneModified", this.onSceneModified);
    editor.removeListener("saveProject", this.onSaveProject);
    editor.removeListener("initialized", this.onEditorInitialized);
    editor.removeListener("error", this.onEditorError);
    editor.removeListener("projectLoaded", this.onProjectLoaded);
    editor.dispose();
  }

  onResize = () => {
    this.state.editor.onResize();
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
   * Scene Event Handlers
   */

  onEditorError = error => {
    if (error.aborted) {
      this.hideDialog();
      return;
    }

    console.error(error);

    this.showDialog(ErrorDialog, {
      title: error.title || "Error",
      message: error.message || "There was an unknown error.",
      error
    });
  };

  onSceneModified = () => {
    this.updateModifiedState();
  };

  onProjectLoaded = () => {
    this.updateModifiedState();
  };

  updateSetting(key, value) {
    const settings = Object.assign(this.state.settingsContext.settings, { [key]: value });
    localStorage.setItem("spoke-settings", JSON.stringify(settings));
    const editor = this.state.editor;
    editor.settings = settings;
    editor.emit("settingsChanged");
    this.setState({
      settingsContext: {
        ...this.state.settingsContext,
        settings
      }
    });
  }

  onLogin = () => {
    this.props.api.showLoginDialog(this.showDialog, this.hideDialog);
  };

  /**
   *  Project Actions
   */

  async loadProject(project) {
    const editor = this.state.editor;

    this.showDialog(ProgressDialog, {
      title: "Loading Project",
      message: "Loading project..."
    });

    try {
      await editor.loadProject(project);

      const projectId = this.props.projectId;

      if (projectId === "new" || projectId === "tutorial") {
        editor.projectId = null;
      } else {
        editor.projectId = projectId;
      }

      if (projectId === "tutorial") {
        this.setState({ onboardingContext: { enabled: true } });
      }

      const sceneId = editor.scene.metadata && editor.scene.metadata.sceneId;

      if (sceneId) {
        editor.sceneUrl = this.props.api.getSceneUrl(sceneId);
      } else {
        editor.sceneUrl = null;
      }

      this.hideDialog();
    } catch (error) {
      console.error(error);

      this.showDialog(ErrorDialog, {
        title: "Error loading project.",
        message: error.message || "There was an error when loading the project.",
        error
      });
    }
  }

  async createProject() {
    const editor = this.state.editor;

    const { blob } = await editor.takeScreenshot(512, 320);

    const result = await new Promise(resolve => {
      this.showDialog(SaveNewProjectDialog, {
        thumbnailUrl: URL.createObjectURL(blob),
        initialName: editor.scene.name,
        onConfirm: resolve,
        onCancel: resolve
      });
    });

    if (result) {
      const abortController = new AbortController();

      this.showDialog(ProgressDialog, {
        title: "Saving Project",
        message: "Saving project...",
        cancelable: true,
        onCancel: () => {
          abortController.abort();
          this.hideDialog();
        }
      });

      editor.setProperty(editor.scene, "name", result.name, false);
      editor.scene.setMetadata({ name: result.name });

      const { projectId } = await this.props.api.createProject(
        editor.scene,
        blob,
        abortController.signal,
        this.showDialog,
        this.hideDialog
      );
      editor.sceneModified = false;
      editor.projectId = projectId;
      this.updateModifiedState(() => {
        this.setState({ creatingProject: true }, () => {
          this.props.history.replace(`/projects/${projectId}`);
          this.setState({ creatingProject: false });
        });
      });
    }
  }

  onNewProject = async () => {
    this.props.history.push("/projects/templates");
  };

  onOpenProject = () => {
    this.props.history.push("/projects");
  };

  onSaveProject = async () => {
    const abortController = new AbortController();

    this.showDialog(ProgressDialog, {
      title: "Saving Project",
      message: "Saving project...",
      cancelable: true,
      onCancel: () => {
        abortController.abort();
        this.hideDialog();
      }
    });

    // Wait for 5ms so that the ProgressDialog shows up.
    await new Promise(resolve => setTimeout(resolve, 5));

    try {
      const editor = this.state.editor;

      if (editor.projectId) {
        await this.props.api.saveProject(
          editor.projectId,
          editor,
          abortController.signal,
          this.showDialog,
          this.hideDialog
        );
      } else {
        await this.createProject();
      }

      editor.sceneModified = false;
      this.updateModifiedState();

      this.hideDialog();
    } catch (error) {
      console.error(error);

      this.showDialog(ErrorDialog, {
        title: "Error Saving Project",
        message: error.message || "There was an error when saving the project."
      });
    }
  };

  onDuplicateProject = async () => {
    const abortController = new AbortController();
    this.showDialog(ProgressDialog, {
      title: "Duplicating Project",
      message: "Duplicating project...",
      cancelable: true,
      onCancel: () => {
        abortController.abort();
        this.hideDialog();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 5));
    try {
      const editor = this.state.editor;
      await this.createProject();
      editor.sceneModified = false;
      this.updateModifiedState();

      this.hideDialog();
    } catch (error) {
      console.error(error);

      this.showDialog(ErrorDialog, {
        title: "Error Saving Project",
        message: error.message || "There was an error when saving the project."
      });
    }
  };

  onExportProject = async () => {
    const options = await new Promise(resolve => {
      this.showDialog(ExportProjectDialog, {
        defaultOptions: Object.assign({}, Editor.DefaultExportOptions),
        onConfirm: resolve,
        onCancel: resolve
      });
    });

    if (!options) {
      this.hideDialog();
      return;
    }

    const abortController = new AbortController();

    this.showDialog(ProgressDialog, {
      title: "Exporting Project",
      message: "Exporting project...",
      cancelable: true,
      onCancel: () => abortController.abort()
    });

    try {
      const editor = this.state.editor;

      const glbBlob = await editor.exportScene(abortController.signal, options);

      this.hideDialog();

      const el = document.createElement("a");
      el.download = editor.scene.name + ".glb";
      el.href = URL.createObjectURL(glbBlob);
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    } catch (error) {
      if (error.aborted) {
        this.hideDialog();
        return;
      }

      console.error(error);

      this.showDialog(ErrorDialog, {
        title: "Error Exporting Project",
        message: error.message || "There was an error when exporting the project.",
        error
      });
    }
  };

  onImportLegacyProject = async () => {
    const confirm = await new Promise(resolve => {
      this.showDialog(ConfirmDialog, {
        title: "Import Legacy Spoke Project",
        message: "Warning! This will overwrite your existing scene! Are you sure you wish to continue?",
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });

    this.hideDialog();

    if (!confirm) return;

    const el = document.createElement("input");
    el.type = "file";
    el.accept = ".spoke";
    el.style.display = "none";
    el.onchange = () => {
      if (el.files.length > 0) {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const json = JSON.parse(fileReader.result);

          if (json.metadata) {
            delete json.metadata.sceneUrl;
            delete json.metadata.sceneId;
          }

          this.loadProject(json);
        };
        fileReader.readAsText(el.files[0]);
      }
    };
    el.click();
  };

  onExportLegacyProject = async () => {
    const editor = this.state.editor;
    const project = editor.scene.serialize();

    if (project.metadata) {
      delete project.metadata.sceneUrl;
      delete project.metadata.sceneId;
    }

    const projectString = JSON.stringify(project);
    const projectBlob = new Blob([projectString]);
    const el = document.createElement("a");
    const fileName = this.state.editor.scene.name.toLowerCase().replace(/\s+/g, "-");
    el.download = fileName + ".spoke";
    el.href = URL.createObjectURL(projectBlob);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  onPublishProject = async () => {
    try {
      const editor = this.state.editor;

      if (!editor.projectId) {
        await this.createProject();
      }

      await this.props.api.publishProject(editor.projectId, editor, this.showDialog, this.hideDialog);
    } catch (error) {
      if (error.aborted) {
        this.hideDialog();
        return;
      }

      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error Publishing Project",
        message: error.message || "There was an unknown error.",
        error
      });
    }
  };

  getSceneId() {
    const scene = this.state.editor.scene;
    return scene.metadata && scene.metadata.sceneId;
  }

  onOpenScene = () => {
    const sceneId = this.getSceneId();

    if (sceneId) {
      const url = this.props.api.getSceneUrl(sceneId);
      window.open(url);
    }
  };

  onFinishTutorial = () => {
    this.setState({ onboardingContext: { enabled: false } });
  };

  render() {
    const { DialogComponent, dialogProps, settingsContext, onboardingContext, editor } = this.state;
    const toolbarMenu = this.generateToolbarMenu();
    const isPublishedScene = !!this.getSceneId();

    return (
      <StyledEditorContainer id="editor-container">
        <SettingsContextProvider value={settingsContext}>
          <EditorContextProvider value={editor}>
            <DialogContextProvider value={this.dialogContext}>
              <OnboardingContextProvider value={onboardingContext}>
                <DndProvider backend={HTML5Backend}>
                  <DragLayer />
                  <ToolBar
                    menu={toolbarMenu}
                    editor={editor}
                    onPublish={this.onPublishProject}
                    isPublishedScene={isPublishedScene}
                    onOpenScene={this.onOpenScene}
                  />
                  <WorkspaceContainer>
                    <Resizeable axis="x" initialSizes={[0.7, 0.3]} onChange={this.onResize}>
                      <ViewportPanelContainer />
                      <Resizeable axis="y" initialSizes={[0.5, 0.5]}>
                        <HierarchyPanelContainer />
                        <PropertiesPanelContainer />
                      </Resizeable>
                    </Resizeable>
                  </WorkspaceContainer>
                  <Modal
                    ariaHideApp={false}
                    isOpen={!!DialogComponent}
                    onRequestClose={this.hideDialog}
                    shouldCloseOnOverlayClick={false}
                    className="Modal"
                    overlayClassName="Overlay"
                  >
                    {DialogComponent && (
                      <DialogComponent onConfirm={this.hideDialog} onCancel={this.hideDialog} {...dialogProps} />
                    )}
                  </Modal>
                  <Helmet>
                    <title>{`${this.state.modified ? "*" : ""}${editor.scene.name} | Spoke by Mozilla`}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
                  </Helmet>
                  {this.state.modified && (
                    <BrowserPrompt
                      message={`${editor.scene.name} has unsaved changes, are you sure you wish to navigate away from the page?`}
                    />
                  )}
                  {onboardingContext.enabled && <Onboarding onFinish={this.onFinishTutorial} />}
                </DndProvider>
              </OnboardingContextProvider>
            </DialogContextProvider>
          </EditorContextProvider>
        </SettingsContextProvider>
      </StyledEditorContainer>
    );
  }
}
