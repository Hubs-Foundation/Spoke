import React, { Component } from "react";
import PropTypes from "prop-types";
import { ContextMenu, MenuItem } from "react-contextmenu";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";

class AssetContextMenu extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    onRemoveItem: PropTypes.func.isRequired,
    api: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired
  };

  onAddAssetToProject = (e, data) => {
    const item = data.item;
    this.props.api.addAssetToProject(this.props.editor.projectId, item.id).catch(console.error);
  };

  onDeleteAsset = (e, data) => {
    const item = data.item;
    this.props.onRemoveItem(item);
    this.props.api.deleteAsset(item.id).catch(console.error);
  };

  render() {
    return (
      <ContextMenu id={this.props.id}>
        <MenuItem onClick={this.onAddAssetToProject}>Add asset to project</MenuItem>
        <MenuItem onClick={this.onDeleteAsset}>Delete asset</MenuItem>
      </ContextMenu>
    );
  }
}

export default withApi(withEditor(AssetContextMenu));
