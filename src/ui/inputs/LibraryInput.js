import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryInput.scss";
import StringInput from "./StringInput";
import Button from "./Button";
import { withDialog } from "../contexts/DialogContext";
import { withApi } from "../contexts/ApiContext";
import { withEditor } from "../contexts/EditorContext";
import LibraryDialog from "../dialogs/LibraryDialog";

class LibraryInput extends Component {
  static propTypes = {
    dialogTitle: PropTypes.string.isRequired,
    component: PropTypes.elementType.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    nodeProps: PropTypes.object,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired,
    api: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      value: props.value
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value && this.props.value !== this.state.value) {
      this.setState({ value: this.props.value });
    }
  }

  onChange = value => {
    this.setState({ value });
  };

  onBlur = e => {
    const src = e.target.value;
    this.props.onChange(src, { src, ...this.props.nodeProps });
  };

  onOpenDialog = () => {
    this.props.showDialog(LibraryDialog, {
      title: this.props.dialogTitle,
      component: this.props.component,
      componentProps: {
        uploadMultiple: false,
        onAfterUpload: this.onAfterUpload,
        onSelectItem: this.onSelectItem
      }
    });
  };

  onAfterUpload = items => {
    this.props.hideDialog();

    const uploadedUrl = items[0].url;

    this.props.onChange(uploadedUrl, { src: uploadedUrl, ...this.props.nodeProps });
  };

  onSelectItem = (NodeType, props, item, source) => {
    const { api, editor, onChange, hideDialog } = this.props;

    hideDialog();

    if (source.value === "assets") {
      api.addAssetToProject(editor.projectId, item.id).catch(console.error);
    }

    onChange(props.src, { src: props.src, ...this.props.nodeProps, ...props });
  };

  render() {
    const { onChange, value, component, dialogTitle, showDialog, hideDialog, nodeProps, ...rest } = this.props;

    return (
      <div className={styles.libraryInput}>
        <StringInput {...rest} value={this.state.value} onChange={this.onChange} onBlur={this.onBlur} />
        <Button onClick={this.onOpenDialog}>Pick</Button>
      </div>
    );
  }
}

export default withDialog(withEditor(withApi(LibraryInput)));
