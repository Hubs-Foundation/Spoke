import React, { Component } from "react";
import PropTypes from "prop-types";
import { MosaicWindow, Mosaic } from "react-mosaic-component";
import Modal from "react-modal";
import { Helmet } from "react-helmet";
import * as Sentry from "@sentry/browser";

import styles from "./EditorContainer.scss";

import ToolBar from "./toolbar/ToolBar";

import HierarchyPanelContainer from "./hierarchy/HierarchyPanelContainer";
import PropertiesPanelContainer from "./properties/PropertiesPanelContainer";
import ViewportPanelContainer from "./viewport/ViewportPanelContainer";

import { defaultSettings, SettingsContextProvider } from "./contexts/SettingsContext";
import { EditorContextProvider } from "./contexts/EditorContext";
import { DialogContextProvider } from "./contexts/DialogContext";

import { createEditor } from "../config";

import ErrorDialog from "./dialogs/ErrorDialog";
import ProgressDialog from "./dialogs/ProgressDialog";
import ConfirmDialog from "./dialogs/ConfirmDialog";

import Onboarding from "./onboarding/Onboarding";
import SupportDialog from "./dialogs/SupportDialog";
import { cmdOrCtrlString } from "./utils";
import BrowserPrompt from "./router/BrowserPrompt";

export default class EditorContainer extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    projectId: PropTypes.string,
    project: PropTypes.object,
    history: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", this.onWindowResize, false);

    let settings = defaultSettings;
    const storedSettings = localStorage.getItem("spoke-settings");
    if (storedSettings) {
      settings = JSON.parse(storedSettings);
    }

    const editor = createEditor(props.api);
    window.editor = editor;
    const editorInitPromise = editor.init();

    this.state = {
      tutorialEnabled: props.projectId === "tutorial",
      editor,
      editorInitPromise,
      creatingProject: false,
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
      DialogComponent: null,
      dialogProps: {}
    };
  }

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
                this.setState({ tutorialEnabled: true });
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
    this.state.editor.signals.windowResize.dispatch();
    this.state.editor.signals.sceneModified.add(this.onSceneModified);
    this.state.editor.signals.editorError.add(this.onEditorError);
    this.state.editor.signals.saveProject.add(this.onSaveProject);
    this.state.editor.signals.viewportInitialized.add(this.onViewportInitialized);

    this.state.editorInitPromise
      .then(() => {
        this.loadProject(this.props.project);
      })
      .catch(e => {
        console.error(e);
      });
  }

  componentDidUpdate(prevProps) {
    if (this.props.project !== prevProps.project) {
      this.state.editorInitPromise
        .then(() => {
          this.loadProject(this.props.project);
        })
        .catch(e => {
          console.error(e);
        });
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize, false);
    this.state.editor.signals.sceneModified.remove(this.onSceneModified);
    this.state.editor.signals.editorError.remove(this.onEditorError);
    this.state.editor.signals.saveProject.remove(this.onSaveProject);
    this.state.editor.signals.viewportInitialized.remove(this.onViewportInitialized);
  }

  onWindowResize = () => {
    this.state.editor.signals.windowResize.dispatch();
  };

  onPanelChange = () => {
    this.state.editor.signals.windowResize.dispatch();
  };

  onViewportInitialized = viewport => {
    const gl = viewport.renderer.context;

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

    this.showDialog(ErrorDialog, {
      title: error.title || "Error",
      message: error.message || "There was an unknown error.",
      error
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
      await editor.loadProject(project, (dependenciesLoaded, totalDependencies) => {
        const loadingProgress = Math.floor((dependenciesLoaded / totalDependencies) * 100);
        this.showDialog(ProgressDialog, {
          title: "Loading Project",
          message: `Loading project: ${loadingProgress}%`
        });
      });

      const projectId = this.props.projectId;

      if (projectId === "new" || projectId === "tutorial") {
        editor.projectId = null;
      } else {
        editor.projectId = projectId;
      }

      if (projectId === "tutorial") {
        this.setState({ tutorialEnabled: true });
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
    const { projectId } = await this.props.api.createProject(this.state.editor, this.showDialog, this.hideDialog);
    this.state.editor.projectId = projectId;
    this.setState({ creatingProject: true }, () => {
      this.props.history.replace(`/projects/${projectId}`);
      this.setState({ creatingProject: false });
    });
  }

  onNewProject = async () => {
    this.props.history.push("/projects/new");
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
    const abortController = new AbortController();

    this.showDialog(ProgressDialog, {
      title: "Exporting Project",
      message: "Exporting project...",
      cancelable: true,
      onCancel: () => abortController.abort()
    });

    try {
      const editor = this.state.editor;

      const glbBlob = await editor.exportScene(abortController.signal);

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
    const fileName = this.state.editor.scene.name.toLowerCase().replace(" ", "-");
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
    const url = this.props.api.getSceneUrl(sceneId);
    window.open(url);
  };

  onFinishTutorial = () => {
    this.setState({ tutorialEnabled: false });
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
    const { DialogComponent, dialogProps, settingsContext, editor, creatingProject, tutorialEnabled } = this.state;
    const toolbarMenu = this.generateToolbarMenu();
    const isPublishedScene = !!this.getSceneId();

    const modified = editor.sceneModified ? "*" : "";

    return (
      <div id="editor-container" className={styles.editorContainer}>
        <SettingsContextProvider value={settingsContext}>
          <EditorContextProvider value={editor}>
            <DialogContextProvider value={this.dialogContext}>
              <ToolBar
                menu={toolbarMenu}
                editor={editor}
                onPublish={this.onPublishProject}
                isPublishedScene={isPublishedScene}
                onOpenScene={this.onOpenScene}
              />
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
                {DialogComponent && (
                  <DialogComponent onConfirm={this.hideDialog} onCancel={this.hideDialog} {...dialogProps} />
                )}
              </Modal>
              <Helmet>
                <title>{`${modified}${editor.scene.name} | Spoke by Mozilla`}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
              </Helmet>
              <BrowserPrompt
                message={`${
                  editor.scene.name
                } has unsaved changes, are you sure you wish to navigate away from the page?`}
                when={editor.sceneModified && !creatingProject}
              />
              {tutorialEnabled && <Onboarding onFinish={this.onFinishTutorial} />}
            </DialogContextProvider>
          </EditorContextProvider>
        </SettingsContextProvider>
      </div>
    );
  }
}
