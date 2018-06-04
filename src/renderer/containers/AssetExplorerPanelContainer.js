import React, { Component } from "react";
import PropTypes from "prop-types";
import Tree from "@robertlong/react-ui-tree";
import "../vendor/react-ui-tree/index.scss";
import classNames from "classnames";
import ContextMenuContainer from "./ContextMenuContainer";
import { withProject } from "./ProjectContext";
import IconGrid from "../components/IconGrid";
import fileIcon from "../assets/file-icon.svg";
import folderIcon from "../assets/folder-icon.svg";
import { openFile } from "../api";
import styles from "./AssetExplorerPanelContainer.scss";

class AssetExplorerPanelContainer extends Component {
  static propTypes = {
    project: PropTypes.any
  };

  static getDerivedStateFromProps(props, state = {}) {
    let tree;

    if (props.project === null) {
      tree = {
        name: "New Project"
      };
    } else {
      tree = props.project.getFileHierarchy();
    }

    return {
      ...state,
      tree
    };
  }

  constructor(props) {
    super(props);

    this.clicked = null;

    this.state = AssetExplorerPanelContainer.getDerivedStateFromProps(props, {
      selectedDirectory: null,
      selectedFile: null,
      singleClickedFile: null
    });
  }

  onClickNode = node => {
    if (node.isDirectory) {
      this.setState({
        selectedDirectory: node
      });
    } else if (node.ext === ".gltf" || node.ext === ".glb") {
      console.log("Open gltf");
    }
  };

  componentDidUpdate(prevProps) {
    if (this.props.project !== prevProps.project) {
      if (prevProps.project !== null) {
        prevProps.project.removeListener("hierarchychanged", this.onHierarchyChanged);
      }

      if (this.props.project !== null) {
        this.setState({
          tree: this.props.project.getFileHierarchy()
        });

        this.props.project.addListener("hierarchychanged", this.onHierarchyChanged);
      }
    }
  }

  onHierarchyChanged = (event, name, fileHierarchy) => {
    this.setState({
      tree: fileHierarchy
    });
  };

  onSelectIcon = ({ file }) => {
    if (this.state.singleClickedFile && file.uri === this.state.singleClickedFile.uri) {
      if (file.isDirectory) {
        this.setState({ selectedDirectory: file });
        return;
      }

      if (file.ext === ".gltf" || file.ext === ".glb") {
        console.log("Open gltf");
        return;
      }

      openFile(file.uri);
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

  renderNode = node => {
    const menuItems = [];

    return (
      <ContextMenuContainer
        className={classNames("node", {
          "is-active": this.state.selectedDirectory
            ? this.state.selectedDirectory.uri === node.uri
            : node === this.state.tree
        })}
        onClick={e => this.onClickNode(node, e)}
        menuItems={menuItems}
      >
        {node.name}
      </ContextMenuContainer>
    );
  };

  render() {
    const selectedDirectory = this.state.selectedDirectory || this.state.tree;
    const files = selectedDirectory.files || [];
    const selectedFile = this.state.selectedFile;
    const icons = files.map(file => ({
      id: file.uri,
      name: file.name,
      src: file.isDirectory ? folderIcon : fileIcon,
      selected: selectedFile && selectedFile.uri === file.uri,
      file
    }));

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
          <IconGrid icons={icons} onSelect={this.onSelectIcon} small />
        </div>
      </div>
    );
  }
}

export default withProject(AssetExplorerPanelContainer);
