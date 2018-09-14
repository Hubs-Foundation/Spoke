import React, { Component } from "react";
import PropTypes from "prop-types";
import Tree from "@robertlong/react-ui-tree";
import "../../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import { withEditor } from "../contexts/EditorContext";
import { withSceneActions } from "../contexts/SceneActionsContext";
import { withDialog } from "../contexts/DialogContext";
import IconGrid from "../IconGrid";
import Icon from "../Icon";
import iconStyles from "../Icon.scss";
import styles from "./AssetExplorerPanelContainer.scss";
import DraggableFile from "../DraggableFile";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import folderIcon from "../../assets/folder-icon.svg";
import ErrorDialog from "../dialogs/ErrorDialog";
import NativeFileDropTarget from "../NativeFileDropTarget";

function collectFileMenuProps({ file }) {
  return file;
}

function getFileContextMenuId(file) {
  if (file.isDirectory) {
    return "directory-menu-default";
  } else if (file.ext === ".spoke") {
    return "file-menu-scene";
  } else if (file.ext === ".gltf" || file.ext === ".glb") {
    return "file-menu-gltf";
  } else {
    return "file-menu-default";
  }
}

function getSelectedDirectory(tree, uri) {
  if (uri === tree.uri) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const selectedDirectory = getSelectedDirectory(child, uri);

      if (selectedDirectory) {
        return selectedDirectory;
      }
    }
  }

  return null;
}

class AssetExplorerPanelContainer extends Component {
  static propTypes = {
    editor: PropTypes.object,
    sceneActions: PropTypes.object,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.clicked = null;

    this.state = {
      tree: props.editor.project.hierarchy,
      selectedDirectory: props.editor.project.hierarchy,
      selectedFile: null,
      singleClickedFile: null,
      newFolderActive: false,
      newFolderName: null
    };
  }

  onClickNode = (e, node) => {
    if (node.isDirectory) {
      this.setState({
        selectedDirectory: node.uri
      });
    }
  };

  componentDidMount() {
    if (this.props.editor.project !== null) {
      this.props.editor.project.watch().then(tree => {
        this.setState({ tree });
      });

      this.props.editor.project.addListener("projectHierarchyChanged", this.onHierarchyChanged);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.editor.project !== prevProps.editor.project) {
      if (prevProps.editor.project !== null) {
        prevProps.editor.project.removeListener("projectHierarchyChanged", this.onHierarchyChanged);
      }

      if (this.props.editor.project !== null) {
        this.props.editor.project.watch().then(tree => {
          this.setState({ tree });
        });

        this.props.editor.project.addListener("projectHierarchyChanged", this.onHierarchyChanged);
      }
    }
  }

  onHierarchyChanged = tree => {
    this.setState({
      tree
    });
  };

  onClickFile = async (e, file) => {
    // Prevent double click on right click.
    if (e.button !== 0) {
      this.setState({ singleClickedFile: null });
      clearTimeout(this.doubleClickTimeout);
      return;
    }

    if (this.state.singleClickedFile && file.uri === this.state.singleClickedFile.uri) {
      // Handle double click
      if (file.isDirectory) {
        this.setState({ selectedDirectory: file.uri });
        return;
      }

      if (file.ext === ".spoke") {
        await this.props.sceneActions.onOpenScene(file.uri);
        return;
      }

      this.props.editor.project.openFile(file.uri);
      return;
    }

    this.setState({
      singleClickedFile: file,
      selectedFile: file
    });

    clearTimeout(this.doubleClickTimeout);
    this.doubleClickTimeout = setTimeout(() => {
      this.setState({ singleClickedFile: null });
    }, 500);
  };

  onNewFolder = e => {
    e.preventDefault();
    this.setState({
      newFolderActive: true,
      newFolderName: "New Folder"
    });
  };

  onCancelNewFolder = () => {
    this.setState({
      newFolderActive: false,
      newFolderName: null
    });
  };

  onNewFolderChange = newFolderName => {
    this.setState({ newFolderName });
  };

  onSubmitNewFolder = () => {
    const folderName = this.state.newFolderName;
    const directoryURI = this.state.selectedDirectory || this.state.tree.uri;

    // eslint-disable-next-line no-useless-escape
    if (!/^[0-9a-zA-Z\^\&\'\@\{\}\[\]\,\$\=\!\-\#\(\)\.\%\+\~\_ ]+$/.test(folderName)) {
      this.props.showDialog(ErrorDialog, {
        title: "Error renaming folder.",
        message: 'Invalid folder name. The following characters are not allowed:  / : * ? " < > |'
      });
      return;
    }

    this.props.editor.project.mkdir(directoryURI + "/" + folderName);

    this.setState({
      newFolderActive: false,
      newFolderName: null
    });
  };

  onCopyURL = (e, file) => {
    const url = new URL(file.uri, window.location).href;
    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.warn("Unable to copy to clipboard.");
    }

    document.body.removeChild(textArea);
  };

  onOpenScene = (e, file) => this.props.sceneActions.onOpenScene(file.uri);

  onOpenFile = (e, file) => this.props.editor.project.openFile(file.uri);

  onDropNativeFiles = async (filesPromise, target) => {
    const files = await filesPromise;

    const directoryPath = target ? target.uri : this.props.editor.project.projectDirectoryPath;
    this.props.sceneActions.onWriteFiles(directoryPath, files);
  };

  renderNode = node => {
    const className = classNames("node", styles.node, {
      "is-active": this.state.selectedDirectory ? this.state.selectedDirectory === node.uri : node === this.state.tree
    });

    const onClick = e => this.onClickNode(e, node);

    return (
      <ContextMenuTrigger
        attributes={{ className, onClick }}
        holdToDisplay={-1}
        id="directory-menu-default"
        file={node}
        collect={collectFileMenuProps}
      >
        {node.name}
      </ContextMenuTrigger>
    );
  };

  render() {
    const selectedDirectory = getSelectedDirectory(this.state.tree, this.state.selectedDirectory) || this.state.tree;
    const files = (selectedDirectory.files || []).filter(
      file => [".gltf", ".glb", ".spoke", ".material"].includes(file.ext) || file.isDirectory
    );
    const selectedFile = this.state.selectedFile;

    return (
      <div className={styles.assetExplorerPanelContainer}>
        <div className={styles.leftColumn}>
          <Tree
            paddingLeft={8}
            isNodeCollapsed={false}
            draggable={false}
            tree={this.state.tree}
            renderNode={this.renderNode}
            onChange={this.onChange}
          />
        </div>
        <NativeFileDropTarget onDropNativeFiles={this.onDropNativeFiles}>
          <ContextMenuTrigger
            attributes={{ className: styles.rightColumn }}
            holdToDisplay={-1}
            id="current-directory-menu-default"
            file={selectedDirectory}
            collect={collectFileMenuProps}
          >
            <IconGrid>
              {files.map(file => (
                <ContextMenuTrigger
                  key={file.uri}
                  holdToDisplay={-1}
                  id={getFileContextMenuId(file)}
                  file={file}
                  collect={collectFileMenuProps}
                >
                  <NativeFileDropTarget onDropNativeFiles={this.onDropNativeFiles} target={file}>
                    <DraggableFile
                      file={file}
                      selected={selectedFile && selectedFile.uri === file.uri}
                      onClick={this.onClickFile}
                    />
                  </NativeFileDropTarget>
                </ContextMenuTrigger>
              ))}
              {this.state.newFolderActive && (
                <Icon
                  rename
                  src={folderIcon}
                  className={iconStyles.small}
                  name={this.state.newFolderName}
                  onChange={this.onNewFolderChange}
                  onCancel={this.onCancelNewFolder}
                  onSubmit={this.onSubmitNewFolder}
                />
              )}
            </IconGrid>
          </ContextMenuTrigger>
        </NativeFileDropTarget>
        <ContextMenu id="directory-menu-default">
          <MenuItem onClick={this.onOpenFile}>Open Directory</MenuItem>
        </ContextMenu>
        <ContextMenu id="file-menu-default">
          <MenuItem onClick={this.onOpenFile}>Open File</MenuItem>
          <MenuItem onClick={this.onCopyURL}>Copy URL</MenuItem>
        </ContextMenu>
        <ContextMenu id="file-menu-scene">
          <MenuItem onCLick={this.onOpenScene}>Open File</MenuItem>
          <MenuItem onClick={this.onCopyURL}>Copy URL</MenuItem>
        </ContextMenu>
        <ContextMenu id="file-menu-gltf">
          <MenuItem onClick={this.onOpenFile}>Open File</MenuItem>
          <MenuItem onClick={this.onCopyURL}>Copy URL</MenuItem>
        </ContextMenu>
        <ContextMenu id="current-directory-menu-default">
          <MenuItem onClick={this.onNewFolder}>New Folder</MenuItem>
          <MenuItem onClick={this.onOpenFile}>Open Directory</MenuItem>
        </ContextMenu>
      </div>
    );
  }
}

export default withEditor(withDialog(withSceneActions(AssetExplorerPanelContainer)));
