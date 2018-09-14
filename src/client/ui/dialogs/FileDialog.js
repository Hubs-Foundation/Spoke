import React, { Component } from "react";
import PropTypes from "prop-types";
import Tree from "@robertlong/react-ui-tree";
import "../../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import { withEditor } from "../contexts/EditorContext";
import IconGrid from "../IconGrid";
import dialogStyles from "./dialog.scss";
import styles from "./FileDialog.scss";
import DraggableFile from "../DraggableFile";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import Button from "../Button";
import StringInput from "../inputs/StringInput";
import Header from "../Header";
import Icon from "../Icon";
import iconStyles from "../Icon.scss";
import folderIcon from "../../assets/folder-icon.svg";
import { getUrlDirname, getUrlFilename, getUrlExtname } from "../../utils/url-path";

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
    editor: PropTypes.any,
    confirmButtonLabel: PropTypes.string,
    filters: PropTypes.arrayOf(PropTypes.string),
    extension: PropTypes.string,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    hideDialog: PropTypes.func.isRequired,
    initialPath: PropTypes.string,
    directory: PropTypes.bool
  };

  static defaultProps = {
    title: "Open File...",
    defaultFileName: "",
    confirmButtonLabel: "Open"
  };

  constructor(props) {
    super(props);

    this.clicked = null;

    let selectedDirectory = null;
    let selectedFile = null;
    let fileName = props.defaultFileName;

    if (props.initialPath) {
      selectedDirectory = getUrlDirname(props.initialPath);
      selectedFile = props.extension && getUrlExtname(props.initialPath) === props.extension ? props.initialPath : null;
      fileName = props.defaultFileName !== "" ? props.defaultFileName : getUrlFilename(props.initialPath);
    }

    this.state = {
      tree: props.editor.project.hierarchy,
      selectedDirectory,
      selectedFile,
      fileName,
      singleClickedFile: null,
      newFolderActive: false,
      newFolderName: null
    };

    this.input = React.createRef();
  }

  componentDidMount() {
    if (this.props.editor.project !== null) {
      this.props.editor.project.watch().then(tree => {
        this.setState({ tree });
      });

      this.props.editor.project.addListener("changed", this.onHierarchyChanged);
    }

    // HACK: need to figure out what is stealing focus and why
    setTimeout(() => {
      this.input.current.focus();
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.editor.project !== prevProps.editor.project) {
      if (prevProps.editor.project !== null) {
        prevProps.editor.project.removeListener("changed", this.onHierarchyChanged);
      }

      if (this.props.editor.project !== null) {
        this.props.editor.project.watch().then(tree => {
          this.setState({ tree });
        });

        this.props.editor.project.addListener("changed", this.onHierarchyChanged);
      }
    }
  }

  componentWillUnmount() {
    clearTimeout(this.doubleClickTimeout);
  }

  onHierarchyChanged = tree => {
    this.setState({ tree });
  };

  onClickNode = (e, node) => {
    if (node.isDirectory) {
      if (this.props.directory) {
        this.setState({
          selectedDirectory: node.uri,
          selectedFile: null,
          fileName: ""
        });
      } else {
        this.setState({
          selectedDirectory: node.uri,
          selectedFile: null
        });
      }
    }
  };

  onClickIcon = (e, file) => {
    const { directory } = this.props;
    const { singleClickedFile } = this.state;

    // Prevent double click on right click.
    if (e.button !== 0) {
      this.setState({ singleClickedFile: null });
      clearTimeout(this.doubleClickTimeout);
      return;
    }

    if (!singleClickedFile) {
      if (!directory && file.isDirectory) {
        this.setState({
          selectedFile: file,
          singleClickedFile: file
        });
      } else {
        this.setState({
          selectedFile: file,
          singleClickedFile: file,
          fileName: getUrlFilename(file.uri) || ""
        });
      }

      clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = setTimeout(() => {
        this.setState({ singleClickedFile: null });
      }, 500);
    } else {
      if (!file.isDirectory && !directory) {
        this.props.onConfirm(file.uri, file.name);
      } else if (file.isDirectory) {
        if (directory) {
          this.setState({
            singleClickedFile: null,
            selectedFile: null,
            fileName: "",
            selectedDirectory: file.uri
          });
        } else {
          this.setState({
            singleClickedFile: null,
            selectedFile: null,
            selectedDirectory: file.uri
          });
        }
      }
    }
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
      alert('Invalid folder name. The following characters are not allowed:  / : * ? " < > |');
      return;
    }

    this.props.editor.project.mkdir(directoryURI + "/" + folderName);

    this.setState({
      newFolderActive: false,
      newFolderName: null
    });
  };

  onChangeFileName = fileName => {
    this.setState({
      selectedFile: null,
      fileName
    });
  };

  onOpenFile = (e, file) => this.props.editor.project.openFile(file.uri);

  onConfirm = e => {
    e.preventDefault();

    if (this.state.selectedFile) {
      this.props.onConfirm(this.state.selectedFile.uri);
      return;
    }

    let fileName = this.state.fileName;

    // eslint-disable-next-line no-useless-escape
    if (!/^[0-9a-zA-Z\^\&\'\@\{\}\[\]\,\$\=\!\-\#\(\)\.\%\+\~\_ ]*$/.test(fileName)) {
      alert('Invalid file name. The following characters are not allowed:  / : * ? " < > |');
      return;
    }

    if (fileName.length === 0 && !this.props.directory) {
      return;
    }

    if (this.props.extension && !this.state.fileName.endsWith(this.props.extension)) {
      fileName = fileName + this.props.extension;
    }

    const directoryURI = this.state.selectedDirectory || this.state.tree.uri;

    if (fileName.length > 0) {
      this.props.onConfirm(directoryURI + "/" + fileName);
    } else {
      this.props.onConfirm(directoryURI);
    }
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
        id="dialog-directory-menu-default"
        file={node}
        collect={collectFileMenuProps}
      >
        {node.name}
      </ContextMenuTrigger>
    );
  };

  render() {
    const { filters, title, onCancel, hideDialog, confirmButtonLabel, directory } = this.props;
    const { tree, selectedDirectory, selectedFile, fileName, newFolderActive, newFolderName } = this.state;

    const activeDirectoryTree = getSelectedDirectory(tree, selectedDirectory) || tree;

    let files = activeDirectoryTree.files || [];

    if (filters && filters.length) {
      files = files.filter(file => file.isDirectory || filters.some(filter => file.ext === filter));
    } else if (directory) {
      files = files.filter(file => file.isDirectory);
    }

    return (
      <div className={dialogStyles.dialogContainer}>
        <Header icon="fa-folder" title={title} />
        <div className={styles.content}>
          <div className={styles.leftColumn}>
            <Tree
              paddingLeft={8}
              isNodeCollapsed={false}
              draggable={false}
              tree={tree}
              renderNode={this.renderNode}
              onChange={this.onChange}
            />
          </div>
          <ContextMenuTrigger
            attributes={{ className: styles.rightColumn }}
            holdToDisplay={-1}
            id="dialog-current-directory-menu-default"
            file={activeDirectoryTree}
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
                  <DraggableFile
                    file={file}
                    selected={selectedFile && selectedFile.uri === file.uri}
                    onClick={this.onClickIcon}
                  />
                </ContextMenuTrigger>
              ))}
              {newFolderActive && (
                <Icon
                  rename
                  src={folderIcon}
                  className={iconStyles.small}
                  name={newFolderName}
                  onChange={this.onNewFolderChange}
                  onCancel={this.onCancelNewFolder}
                  onSubmit={this.onSubmitNewFolder}
                />
              )}
            </IconGrid>
          </ContextMenuTrigger>
          <ContextMenu id="dialog-directory-menu-default">
            <MenuItem onClick={this.onOpenFile}>Open Directory</MenuItem>
          </ContextMenu>
          <ContextMenu id="dialog-file-menu-default">
            <MenuItem onClick={this.onOpenFile}>Open File</MenuItem>
          </ContextMenu>
          <ContextMenu id="dialog-current-directory-menu-default">
            <MenuItem onClick={this.onNewFolder}>New Folder</MenuItem>
            <MenuItem onClick={this.onOpenFile}>Open Directory</MenuItem>
          </ContextMenu>
        </div>
        <form>
          <div className={dialogStyles.bottom}>
            <div className={styles.fileNameLabel}>File Name:</div>
            <StringInput value={fileName} ref={this.input} onChange={this.onChangeFileName} autoFocus />
            <Button type="button" onClick={onCancel || hideDialog} className={styles.cancel}>
              Cancel
            </Button>
            <Button type="submit" onClick={this.onConfirm}>
              {confirmButtonLabel}
            </Button>
          </div>
        </form>
      </div>
    );
  }
}

export default withEditor(FileDialog);
