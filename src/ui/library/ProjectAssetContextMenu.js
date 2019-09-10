import React, { Component } from "react";
import PropTypes from "prop-types";
import { ContextMenu, MenuItem } from "../layout/ContextMenu";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";

class ProjectAssetContextMenu extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    onRemoveItem: PropTypes.func.isRequired,
    api: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired
  };

  onDeleteAsset = (e, data) => {
    const item = data.item;
    this.props.onRemoveItem(item);
    this.props.api.deleteAsset(item.id).catch(console.error);
  };

  onDeleteProjectAsset = (e, data) => {
    const item = data.item;
    this.props.onRemoveItem(item);
    this.props.api.deleteProjectAsset(this.props.editor.projectId, item.id).catch(console.error);
  };

  render() {
    return (
      <ContextMenu id={this.props.id}>
        <MenuItem onClick={this.onDeleteProjectAsset}>Remove asset from project</MenuItem>
        <MenuItem onClick={this.onDeleteAsset}>Delete asset</MenuItem>
      </ContextMenu>
    );
  }
}

export default withApi(withEditor(ProjectAssetContextMenu));
