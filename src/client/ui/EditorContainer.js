import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { MosaicWindow } from "react-mosaic-component";
import { HotKeys } from "react-hotkeys";
import Modal from "react-modal";
import { MosaicWithoutDragDropContext } from "react-mosaic-component";
import MenuBarContainer from "./menus/MenuBarContainer";
import ViewportPanelContainer from "./panels/ViewportPanelContainer";
import ViewportPanelToolbarContainer from "./panels/ViewportPanelToolbarContainer";
import HierarchyPanelContainer from "./panels/HierarchyPanelContainer";
import PropertiesPanelContainer from "./panels/PropertiesPanelContainer";
import AssetExplorerPanelContainer from "./panels/AssetExplorerPanelContainer";
import { withProject } from "./contexts/ProjectContext";
import { withEditor } from "./contexts/EditorContext";
import { DialogContextProvider } from "./contexts/DialogContext";
import { OptionDialog } from "./dialogs/OptionDialog";
import styles from "../common.scss";
import FileDialog from "./dialogs/FileDialog";
import ProgressDialog, { PROGRESS_DIALOG_DELAY } from "./dialogs/ProgressDialog";
import ErrorDialog from "./dialogs/ErrorDialog";
import ConflictError from "../editor/ConflictError";

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
            toolbarControls: [],
            draggable: false
          }
        },
        viewport: {
          component: ViewportPanelContainer,
          windowProps: {
            title: "Viewport",
            toolbarControls: ViewportPanelToolbarContainer(),
            draggable: false
          }
        },
        properties: {
          component: PropertiesPanelContainer,
          windowProps: {
            title: "Properties",
            toolbarControls: [],
            draggable: false
          }
        },
        assetExplorer: {
          component: AssetExplorerPanelContainer,
          windowProps: {
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
              action: e => this.onOpenExportModal(e)
            },
            {
              name: "Open Project Directory",
              action: () => this.props.project.openFile(this.props.project.projectDirectoryPath)
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
    this.props.editor.signals.popScene.add(this.onPopScene);
    this.props.editor.signals.openScene.add(this.onOpenScene);
    this.props.editor.signals.extendScene.add(this.onExtendScene);
    this.props.editor.signals.sceneModified.add(this.onSceneModified);
    this.props.editor.signals.sceneErrorOccurred.add(this.onSceneErrorOccurred);
    this.props.project.addListener("change", path => {
      this.props.editor.signals.fileChanged.dispatch(path);
    });

    window.onbeforeunload = e => {
      if (!this.props.editor.sceneModified()) {
        return undefined;
      }

      const dialogText = "Your scene has unsaved changes, are you sure you wish to navigate away from the page?";
      e.returnValue = dialogText;
      return dialogText;
    };
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

  onCloseModal = () => {
    this.setState({
      openModal: null
    });
  };

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

  openSaveAsDialog(onSave) {
    this.showDialog(FileDialog, {
      title: "Save scene as...",
      filters: [".scene"],
      extension: ".scene",
      confirmButtonLabel: "Save",
      onConfirm: onSave
    });
  }

  onSave = async e => {
    e.preventDefault();

    if (this.state.DialogComponent !== null) {
      return;
    }

    if (!this.props.editor.sceneInfo.uri || this.props.editor.sceneInfo.uri.endsWith(".gltf")) {
      this.openSaveAsDialog(this.serializeAndSaveScene);
    } else {
      this.serializeAndSaveScene(this.props.editor.sceneInfo.uri);
    }
  };

  onSaveAs = e => {
    e.preventDefault();

    if (this.state.DialogComponent !== null) {
      return;
    }

    this.openSaveAsDialog(this.serializeAndSaveScene);
  };

  serializeAndSaveScene = async sceneURI => {
    let saved = false;

    this.hideDialog();

    try {
      setTimeout(() => {
        if (saved) return;
        this.showDialog(ProgressDialog, {
          title: "Saving Scene",
          message: "Saving scene..."
        });
      }, PROGRESS_DIALOG_DELAY);

      const { project, editor } = this.props;

      const serializedScene = editor.serializeScene(sceneURI);

      editor.ignoreNextSceneFileChange = true;

      await project.writeJSON(sceneURI, serializedScene);

      const sceneUserData = editor.scene.userData;

      // If the previous URI was a gltf, update the ancestors, since we are now dealing with a .scene file.
      if (editor.sceneInfo.uri && editor.sceneInfo.uri.endsWith(".gltf")) {
        sceneUserData._ancestors = [editor.sceneInfo.uri];
      }

      editor.setSceneURI(sceneURI);

      editor.signals.sceneGraphChanged.dispatch();

      editor.sceneInfo.modified = false;
      this.onSceneModified();

      this.hideDialog();
    } catch (e) {
      console.error(e);
      this.showDialog(ErrorDialog, {
        title: "Error Saving Scene",
        message: e.message || "There was an error when saving the scene."
      });
    } finally {
      saved = true;
    }
  };

  onOpenExportModal = e => {
    e.preventDefault();

    this.showDialog(FileDialog, {
      title: "Select the output directory",
      confirmButtonLabel: "Export scene",
      directory: true,
      onConfirm: async outputPath => {
        let exported = false;

        this.hideDialog();

        try {
          setTimeout(() => {
            if (exported) return;
            this.showDialog(ProgressDialog, {
              title: "Exporting Scene",
              message: "Exporting scene..."
            });
          }, PROGRESS_DIALOG_DELAY);

          // Export current editor scene using THREE.GLTFExporter
          const { json, buffers, images } = await this.props.editor.exportScene();

          // Ensure the output directory exists
          await this.props.project.mkdir(outputPath);

          // Write the .gltf file
          const scene = this.props.editor.scene;
          const gltfPath = outputPath + "/" + scene.name + ".gltf";
          await this.props.project.writeJSON(gltfPath, json);

          // Write .bin files
          for (const [index, buffer] of buffers.entries()) {
            if (buffer !== undefined) {
              const bufferName = json.buffers[index].uri;
              await this.props.project.writeBlob(outputPath + "/" + bufferName, buffer);
            }
          }

          // Write image files
          for (const [index, image] of images.entries()) {
            if (image !== undefined) {
              const imageName = json.images[index].uri;
              await this.props.project.writeBlob(outputPath + "/" + imageName, image);
            }
          }

          // Run optimizations on .gltf and overwrite any existing files
          await this.props.project.optimizeScene(gltfPath, gltfPath);
          this.hideDialog();
        } catch (e) {
          console.error(e);
          this.showDialog(ErrorDialog, {
            title: "Error Exporting Scene",
            message: e.message || "There was an error when exporting the scene."
          });
        } finally {
          exported = true;
        }
      }
    });
  };

  onSceneModified = () => {
    const modified = this.props.editor.sceneModified() ? "*" : "";
    document.title = `Spoke - ${this.props.editor.scene.name}${modified}`;
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

  onNewScene = () => {
    if (!this.confirmSceneChange()) return;
    this.props.editor.loadNewScene();
  };

  onOpenScene = async uri => {
    if (this.props.editor.sceneInfo.uri === uri) return;
    if (!this.confirmSceneChange()) return;
    this._tryLoadSceneFromURI(uri, this.props.editor.openRootScene.bind(this.props.editor), this.onOpenScene);
  };

  onExtendScene = async uri => {
    if (!this.confirmSceneChange()) return;
    this._tryLoadSceneFromURI(uri, this.props.editor.extendScene.bind(this.props.editor), this.onExtendScene);
  };

  _tryLoadSceneFromURI = async (uri, action, reload) => {
    let opened = false;

    try {
      setTimeout(() => {
        if (opened) return;
        this.showDialog(ProgressDialog, {
          title: "Opening Scene",
          message: "Opening scene..."
        });
      }, PROGRESS_DIALOG_DELAY);
      await action(uri);
      this.hideDialog();
    } catch (e) {
      if (e instanceof ConflictError) {
        this.onSceneErrorOccurred(e, uri, reload);
      } else {
        this.showDialog(OptionDialog, {
          title: "Error Opening Scene",
          message: `
                ${e.message}:
                ${e.url}.
                Please make sure the file exists and then press "Resolved" to reload the scene.
              `,
          options: [
            {
              label: "Resolved",
              onClick: () => {
                this.hideDialog();
                reload(uri);
              }
            }
          ],
          cancelLabel: "Cancel"
        });
      }
    } finally {
      opened = true;
    }
  };

  onSceneErrorOccurred = (error, uri, reload) => {
    if (error.type === "import") {
      // empty/duplicate node names in the importing file
      this.showDialog(OptionDialog, {
        title: "Resolve Node Conflicts",
        message:
          "We've found duplicate and/or missing node names in this file.\nWould you like to fix all conflicts?\n*This will modify the original file.",
        options: [
          {
            label: "Okay",
            onClick: () => {
              this.hideDialog();
              this._overwriteConflictsInSource(error.uri, error.handler, () => {
                reload(uri);
              });
            }
          }
        ],
        cancelLabel: "Cancel"
      });
    } else if (error.type === "rename") {
      // renaming
      this.showDialog(ErrorDialog, {
        title: "Name in Use",
        message: "Node name is already in use. Please choose another.",
        confirmLabel: "Okay"
      });
    }
  };

  _overwriteConflictsInSource = async (uri, conflictHandler, callback) => {
    const { project } = this.props;
    if (uri && uri.endsWith(".gltf")) {
      const originalGLTF = await project.readJSON(uri);
      const nodes = originalGLTF.nodes;
      if (nodes) {
        conflictHandler.updateNodeNames(nodes);
        await project.writeJSON(uri, originalGLTF);
        callback();
      }
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
    const { openModal, menus, DialogComponent, dialogProps } = this.state;

    const { initialPanels } = this.props;

    const dialogContext = { showDialog: this.showDialog, hideDialog: this.hideDialog };

    return (
      <DragDropContextProvider backend={HTML5Backend}>
        <HotKeys keyMap={this.state.keyMap} handlers={this.state.globalHotKeyHandlers} className={styles.flexColumn}>
          <DialogContextProvider value={dialogContext}>
            <MenuBarContainer menus={menus} />
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
          </DialogContextProvider>
        </HotKeys>
      </DragDropContextProvider>
    );
  }
}

export default withProject(withEditor(EditorContainer));
