import React, { Component } from "react";
import PropTypes from "prop-types";
import Tree from "@robertlong/react-ui-tree";
import "../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import { withProject } from "./ProjectContext";
import IconGrid from "../components/IconGrid";
import styles from "./FileDialogModalContainer.scss";
import DraggableFile from "../components/DraggableFile";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import Button from "../components/Button";
import StringInput from "../components/StringInput";
import Header from "../components/Header";

function collectFileMenuProps({ file }) {
  return file;
}

function getFileContextMenuId(file) {
  if (file.isDirectory) {
    return "directory-menu-default";
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

class FileDialogContainer extends Component {
  static propTypes = {
    title: PropTypes.string,
    defaultFileName: PropTypes.string,
    project: PropTypes.any,
    confirmButtonLabel: PropTypes.string,
    filter: PropTypes.string,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func
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
      fileName: props.defaultFileName
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

    let fileName = file.name;

    if (this.props.filter) {
      if (!file.name.endsWith(this.props.filter)) {
        return;
      }

      fileName = fileName.replace(this.props.filter, "");
    }

    this.setState({
      singleClickedFile: file,
      selectedFile: file,
      fileName
    });

    clearTimeout(this.doubleClickTimeout);
    this.doubleClickTimeout = setTimeout(() => {
      this.setState({ singleClickedFile: null });
    }, 500);
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

      // eslint-disable-next-line
      if (!/^[0-9a-zA-Z\^\&\'\@\{\}\[\]\,\$\=\!\-\#\(\)\.\%\+\~\_ ]+$/.test(fileName)) {
        alert('Invalid file name. The following characters are not allowed:  / : * ? " < > |');
      }

      if (this.props.filter && !this.state.fileName.endsWith(this.props.filter)) {
        fileName = fileName + this.props.filter;
      }

      const directoryURI = this.state.selectedDirectory || this.state.tree.uri;

      this.props.onConfirm(directoryURI + "/" + fileName);
    }
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
    const files = selectedDirectory.files || [];
    const selectedFile = this.state.selectedFile;

    return (
      <div className={styles.fileDialogModalContainer}>
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
          <div className={styles.rightColumn}>
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
            </IconGrid>
            <ContextMenu id="directory-menu-default">
              <MenuItem>Open Directory</MenuItem>
              <MenuItem>Delete Directory</MenuItem>
            </ContextMenu>
            <ContextMenu id="file-menu-default">
              <MenuItem>Open File</MenuItem>
              <MenuItem>Delete File</MenuItem>
            </ContextMenu>
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.fileNameLabel}>File Name:</div>
          <StringInput value={this.state.fileName} onChange={this.onChangeFileName} />
          <Button onClick={this.props.onCancel}>Cancel</Button>
          <Button onClick={this.onConfirm}>{this.props.confirmButtonLabel}</Button>
        </div>
      </div>
    );
  }
}

export default withProject(FileDialogContainer);
