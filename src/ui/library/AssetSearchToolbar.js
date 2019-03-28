import React, { Component } from "react";
import PropTypes from "prop-types";
import LibraryFilterInput from "./LibraryFilterInput";
import LibrarySearchInput from "./LibrarySearchInput";
import FileInput from "../inputs/FileInput";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";

const filterFileTypes = {
  all: ".png,.jpeg,.jpg,.gif,.mp4,.glb,image/png,image/jpeg,image/gif,video/mp4,model/gltf-binary",
  images: ".png,.jpeg,.jpg,.gif,image/png, image/jpeg, image/gif",
  videos: ".mp4,video/mp4",
  models: ".glb,model/gltf-binary"
};

class AssetSearchToolbar extends Component {
  static propTypes = {
    defaultFilter: PropTypes.string,
    filterOptions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string
      })
    ),
    searchPlaceholder: PropTypes.string,
    legal: PropTypes.string,
    privacyPolicyUrl: PropTypes.string,
    onChangeSearchParams: PropTypes.func.isRequired,
    onAddItem: PropTypes.func.isRequired,
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      filter: props.defaultFilter,
      q: ""
    };
  }

  componentDidMount() {
    this.props.onChangeSearchParams(this.state);
  }

  onChangeFilter = filter => {
    this.setState({ filter });
    this.props.onChangeSearchParams({ filter, q: this.state.q });
  };

  onChangeQuery = e => {
    const q = e.target.value;
    this.setState({ q });
    this.props.onChangeSearchParams({ filter: this.state.filter, q });
  };

  onUpload = files => {
    const { api, editor, showDialog, hideDialog } = this.props;
    api
      .uploadProjectAsset(editor.projectId, files[0], showDialog, hideDialog)
      .then(this.props.onAddItem)
      .catch(console.error);
  };

  render() {
    const filter = this.state.filter;

    return (
      <>
        {this.props.filterOptions.length > 1 && (
          <LibraryFilterInput
            options={this.props.filterOptions}
            value={this.state.filter}
            onChange={this.onChangeFilter}
          />
        )}
        <LibrarySearchInput
          placeholder={this.props.searchPlaceholder}
          value={this.state.q}
          onChange={this.onChangeQuery}
          legal={this.props.legal}
          privacyPolicyUrl={this.props.privacyPolicyUrl}
        />
        <FileInput accept={filterFileTypes[filter]} onChange={this.onUpload} />
      </>
    );
  }
}

export default withApi(withEditor(withDialog(AssetSearchToolbar)));
