import React, { Component } from "react";
import PropTypes from "prop-types";
import MediaSearchPanel from "./MediaSearchPanel";
import FileInput from "../inputs/FileInput";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import { withDialog } from "../contexts/DialogContext";
import VideoNode from "../../editor/nodes/VideoNode";
import ImageNode from "../../editor/nodes/ImageNode";
import ModelNode from "../../editor/nodes/ModelNode";

const filterFileTypes = {
  all: ".png,.jpeg,.jpg,.gif,.mp4,.glb,image/png,image/jpeg,image/gif,video/mp4,model/gltf-binary",
  images: ".png,.jpeg,.jpg,.gif,image/png, image/jpeg, image/gif",
  videos: ".mp4,video/mp4",
  models: ".glb,model/gltf-binary"
};

class MyFilesLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      sources: [
        {
          id: "files",
          label: "My Files",
          placeholder: "Search files...",
          defaultFilter: "all",
          filters: ["all", "models", "images", "videos"],
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          renderToolbar: this.renderToolbar
        }
      ]
    };
  }

  onSelect = item => {
    console.log(item);
    let nodeType;

    if (item.contentType.startsWith("image/")) {
      nodeType = ImageNode;
    } else if (item.contentType.startsWith("video/")) {
      nodeType = VideoNode;
    } else if (item.contentType.startsWith("gltf")) {
      nodeType = ModelNode;
    }

    if (nodeType) {
      this.props.onSelectItem(nodeType, { src: item.url });
    }
  };

  renderToolbar = (source, filter, addItem) => {
    return <FileInput accept={filterFileTypes[filter]} onChange={files => this.onUpload(files, addItem)} />;
  };

  onUpload = (files, addItem) => {
    const { api, editor, showDialog, hideDialog } = this.props;
    api
      .uploadProjectFile(editor.projectId, files[0], showDialog, hideDialog)
      .then(item =>
        addItem({
          ...item,
          images: {
            preview: {
              url: null
            }
          },
          attributions: {}
        })
      )
      .catch(console.error);
  };

  render() {
    return <MediaSearchPanel onSelect={this.onSelect} sources={this.state.sources} />;
  }
}

export default withApi(withEditor(withDialog(MyFilesLibrary)));
