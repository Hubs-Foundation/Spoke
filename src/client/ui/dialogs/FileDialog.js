import React, { Component } from "react";
import PropTypes from "prop-types";
import Tree from "@robertlong/react-ui-tree";
import "../../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import { withProject } from "../contexts/ProjectContext";
import IconGrid from "../IconGrid";
import styles from "./FileDialog.scss";
import DraggableFile from "../DraggableFile";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import Button from "../Button";
import StringInput from "../inputs/StringInput";
import Header from "../Header";
import Icon from "../Icon";
import iconStyles from "../Icon.scss";
import folderIcon from "../../assets/folder-icon.svg";

function collectFileMenuProps({ file }) {
  return file;
}

function getFileContextMenuId(file) {
  if (file.isDirectory) {
    return "dialog-directory-menu-default";
  } else {
    return "dialog-file-menu-default";
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

class FileDialog extends Component {
  static propTypes = {
    title: PropTypes.string,
    defaultFileName: PropTypes.string,
    project: PropTypes.any,
    confirmButtonLabel: PropTypes.string,
    filters: PropTypes.arrayOf(PropTypes.string),
    extension: PropTypes.string,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    hideDialog: PropTypes.func.isRequired
  };

  static defaultProps = {
    title: "Open File...",
    defaultFileName: "",
    confirmButtonLabel: "Open"
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
      fileName: props.defaultFileName,
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
    }

    if (this.props.filters) {
      const matchingFilter = this.props.filters.find(filter => file.name.endsWith(filter));
      if (!matchingFilter) {
        this.setState({
          singleClickedFile: file,
          selectedFile: file
        });
        return;
      }
    }

    this.setState({
      singleClickedFile: file,
      selectedFile: file,
      fileName: file.name
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

    // eslint-disable-next-line no-useless-escape
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

  onChangeFileName = e => {
    this.setState({
      selectedFile: null,
      fileName: e.target.value
    });
  };

  onConfirm = e => {
    e.preventDefault();

    if (this.selectedFile) {
      this.props.onConfirm(this.selectedFile.uri);
    } else {
      let fileName = this.state.fileName;

      // eslint-disable-next-line no-useless-escape
      if (!/^[0-9a-zA-Z\^\&\'\@\{\}\[\]\,\$\=\!\-\#\(\)\.\%\+\~\_ ]+$/.test(fileName)) {
        alert('Invalid file name. The following characters are not allowed:  / : * ? " < > |');
        return;
      }

      if (this.props.extension && !this.state.fileName.endsWith(this.props.extension)) {
        fileName = fileName + this.props.extension;
      }

      const directoryURI = this.state.selectedDirectory || this.state.tree.uri;

      this.props.onConfirm(directoryURI + "/" + fileName);
    }
  };

  renderNode = node => {
    return (
      <div
        id="node-menu"
        className={classNames("node", styles.node, {
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
    let files = selectedDirectory.files || [];
    if (this.props.filters && this.props.filters.length) {
      files = files.filter(file => file.isDirectory || this.props.filters.some(filter => file.name.endsWith(filter)));
    }
    const selectedFile = this.state.selectedFile;

    return (
      <div className={styles.fileDialog}>
        <Header title={this.props.title} />
        <div className={styles.content}>
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
            id="dialog-current-directory-menu-default"
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
          <ContextMenu id="dialog-directory-menu-default">
            <MenuItem>Open Directory</MenuItem>
            <MenuItem>Delete Directory</MenuItem>
          </ContextMenu>
          <ContextMenu id="dialog-file-menu-default">
            <MenuItem>Open File</MenuItem>
            <MenuItem>Delete File</MenuItem>
          </ContextMenu>
          <ContextMenu id="dialog-current-directory-menu-default">
            <MenuItem onClick={this.onNewFolder}>New Folder</MenuItem>
          </ContextMenu>
        </div>
        <div className={styles.bottom}>
          <div className={styles.fileNameLabel}>File Name:</div>
          <StringInput value={this.state.fileName} onChange={this.onChangeFileName} />
          <Button onClick={this.props.onCancel || this.props.hideDialog}>Cancel</Button>
          <Button onClick={this.onConfirm}>{this.props.confirmButtonLabel}</Button>
        </div>
      </div>
    );
  }
}

export default withProject(FileDialog);
