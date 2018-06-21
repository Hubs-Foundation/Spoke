import React, { Component } from "react";
import PropTypes from "prop-types";
import Tree from "@robertlong/react-ui-tree";
import "../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import { withProject } from "./ProjectContext";
import { withEditor } from "./EditorContext";
import IconGrid from "../components/IconGrid";
import styles from "./AssetExplorerPanelContainer.scss";
import DraggableFile from "../components/DraggableFile";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

function collectFileMenuProps({ file }) {
  return file;
}

function getFileContextMenuId(file) {
  if (file.isDirectory) {
    return "directory-menu-default";
  } else if (
    file.ext === "gltf" ||
    (file.ext === "json" && (file.name.endsWith("bundle.config.json") || file.name.endsWith("bundle.json")))
  ) {
    return "file-menu-preview";
  } else {
    return "file-menu-default";
  }
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
      singleClickedFile: null
    };
  }

  onClickNode = (e, node) => {
    if (node.isDirectory) {
      this.setState({
        selectedDirectory: node
      });
    }
  };

  componentDidMount() {
    if (this.props.project !== null) {
      this.props.project.getFileHierarchy().then(tree => {
        this.setState({ tree });
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.project !== prevProps.project) {
      if (prevProps.project !== null) {
        prevProps.project.removeListener("hierarchychanged", this.onHierarchyChanged);
      }

      if (this.props.project !== null) {
        this.props.project.getFileHierarchy().then(tree => {
          this.setState({ tree });
        });

        this.props.project.addListener("hierarchychanged", this.onHierarchyChanged);
      }
    }
  }

  onHierarchyChanged = fileHierarchy => {
    this.setState({
      tree: fileHierarchy
    });
  };

  onClickFile = (e, file) => {
    if (this.state.singleClickedFile && file.uri === this.state.singleClickedFile.uri) {
      if (file.isDirectory) {
        this.setState({ selectedDirectory: file });
        return;
      }

      if (file.ext === "gltf") {
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

  onPreview = (e, file) => {
    console.log("preview in hubs", file);
  };

  renderNode = node => {
    return (
      <div
        id="node-menu"
        className={classNames("node", {
          "is-active": this.state.selectedDirectory
            ? this.state.selectedDirectory.uri === node.uri
            : node === this.state.tree
        })}
        onClick={e => this.onClickNode(e, node)}
      >
        {node.name}
      </div>
    );
  };

  render() {
    const selectedDirectory = this.state.selectedDirectory || this.state.tree;
    const files = selectedDirectory.files || [];
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
          <ContextMenu id="file-menu-preview">
            <MenuItem onClick={this.onPreview}>Preview in Hubs</MenuItem>
            <MenuItem>Open File</MenuItem>
            <MenuItem>Delete File</MenuItem>
          </ContextMenu>
        </div>
      </div>
    );
  }
}

export default withProject(withEditor(AssetExplorerPanelContainer));
