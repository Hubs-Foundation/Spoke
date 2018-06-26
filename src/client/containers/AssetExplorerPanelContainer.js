import React, { Component } from "react";
import PropTypes from "prop-types";
import Tree from "@robertlong/react-ui-tree";
import "../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import { withProject } from "./ProjectContext";
import { withEditor } from "./EditorContext";
import IconGrid from "../components/IconGrid";
import Icon from "../components/Icon";
import iconStyles from "../components/Icon.scss";
import styles from "./AssetExplorerPanelContainer.scss";
import DraggableFile from "../components/DraggableFile";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import folderIcon from "../assets/folder-icon.svg";

function collectFileMenuProps({ file }) {
  return file;
}

function getFileContextMenuId(file) {
  if (file.isDirectory) {
    return "directory-menu-default";
  } else if (
    file.ext === ".gltf" ||
    (file.ext === ".json" && (file.name.endsWith("bundle.config.json") || file.name.endsWith("bundle.json")))
  ) {
    return "file-menu-preview";
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
    project: PropTypes.any,
    editor: PropTypes.any
  };

  constructor(props) {
    super(props);

    this.clicked = null;

    this.state = {
      tree: {
        name: "New Project"
      },
      selectedDirectory: null,
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
    if (this.props.project !== null) {
      this.props.project.watch().then(tree => {
        this.setState({ tree });
      });

      this.props.project.addListener("changed", this.onHierarchyChanged);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.project !== prevProps.project) {
      if (prevProps.project !== null) {
        prevProps.project.removeListener("changed", this.onHierarchyChanged);
      }

      if (this.props.project !== null) {
        this.props.project.watch().then(tree => {
          this.setState({ tree });
        });

        this.props.project.addListener("changed", this.onHierarchyChanged);
      }
    }
  }

  onHierarchyChanged = tree => {
    this.setState({
      tree
    });
  };

  onClickFile = (e, file) => {
    if (this.state.singleClickedFile && file.uri === this.state.singleClickedFile.uri) {
      if (file.isDirectory) {
        this.setState({ selectedDirectory: file.uri });
        return;
      }

      if (file.ext === ".gltf") {
        this.props.editor.signals.openScene.dispatch(file.uri);
        return;
      }

      this.props.project.openFile(file.uri);
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

  onNewFolderChange = e => {
    this.setState({ newFolderName: e.target.value });
  };

  onSubmitNewFolder = () => {
    const folderName = this.state.newFolderName;
    const directoryURI = this.state.selectedDirectory || this.state.tree.uri;

    // eslint-disable-next-line
    if (!/^[0-9a-zA-Z\^\&\'\@\{\}\[\]\,\$\=\!\-\#\(\)\.\%\+\~\_ ]+$/.test(folderName)) {
      alert('Invalid folder name. The following characters are not allowed:  / : * ? " < > |');
      return;
    }

    this.props.project.mkdir(directoryURI + "/" + folderName);

    this.setState({
      newFolderActive: false,
      newFolderName: null
    });
  };

  onPreview = (e, file) => {
    console.log("preview in hubs", file);
  };

  renderNode = node => {
    return (
      <div
        id="node-menu"
        className={classNames("node", {
          "is-active": this.state.selectedDirectory
            ? this.state.selectedDirectory === node.uri
            : node === this.state.tree
        })}
        onClick={e => this.onClickNode(e, node)}
      >
        {node.name}
      </div>
    );
  };

  render() {
    const selectedDirectory = getSelectedDirectory(this.state.tree, this.state.selectedDirectory) || this.state.tree;
    const files = (selectedDirectory.files || []).filter(file => file.ext === ".gltf" || file.isDirectory);
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
        <ContextMenuTrigger
          attributes={{ className: styles.rightColumn }}
          holdToDisplay={-1}
          id="current-directory-menu-default"
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
                <DraggableFile
                  file={file}
                  selected={selectedFile && selectedFile.uri === file.uri}
                  onClick={this.onClickFile}
                />
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
        <ContextMenu id="directory-menu-default">
          <MenuItem>Open Directory</MenuItem>
          <MenuItem>Delete Directory</MenuItem>
        </ContextMenu>
        <ContextMenu id="file-menu-default">
          <MenuItem>Open File</MenuItem>
          <MenuItem>Delete File</MenuItem>
        </ContextMenu>
        <ContextMenu id="file-menu-preview">
          <MenuItem onClick={this.onPreview}>Preview in Hubs</MenuItem>
          <MenuItem>Open File</MenuItem>
          <MenuItem>Delete File</MenuItem>
        </ContextMenu>
        <ContextMenu id="current-directory-menu-default">
          <MenuItem onClick={this.onNewFolder}>New Folder</MenuItem>
        </ContextMenu>
      </div>
    );
  }
}

export default withProject(withEditor(AssetExplorerPanelContainer));
