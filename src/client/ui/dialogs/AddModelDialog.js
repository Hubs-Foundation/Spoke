import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../inputs/Button";
import StringInput from "../inputs/StringInput";
import DialogHeader from "./DialogHeader";
import FileDialog from "./FileDialog";

const DEFAULT_OBJECT_URL = "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf";

export default class AddModelDialog extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    okLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    chooseFileLabel: PropTypes.string,
    showDialog: PropTypes.func,
    hideDialog: PropTypes.func
  };

  static defaultProps = {
    okLabel: "Add",
    cancelLabel: "Cancel",
    chooseFileLabel: "Choose File..."
  };

  state = {
    url: ""
  };

  constructor(props) {
    super(props);
  }

  handleChange = value => {
    this.setState({ url: value });
  };

  isValidURLEntered = () => {
    try {
      new URL(this.state.url);
      return true;
    } catch (e) {
      return false;
    }
  };

  onFilePickerChosen = () => {
    this.props.showDialog(FileDialog, {
      filters: [".glb", ".gltf"],
      onCancel: this.props.hideDialog,
      onConfirm: (uri, name) => {
        this.props.onConfirm(uri, name);
      }
    });
  };

  onSubmit = () => {
    this.props.onConfirm(this.state.url || DEFAULT_OBJECT_URL);
  };

  render = () => {
    const okAttributes = {};

    if (!this.isValidURLEntered() && this.state.url !== "") {
      okAttributes.disabled = true;
    }

    return (
      <div className={styles.dialogContainer}>
        <form>
          <DialogHeader title={this.props.title} />
          <div className={styles.content}>
            <div className={styles.contentRows}>
              <p>{this.props.message}</p>
              <div className={styles.fieldRow}>
                <StringInput value={this.state.url} onChange={this.handleChange} autoFocus />
                <Button type="button" onClick={this.onFilePickerChosen}>
                  {this.props.chooseFileLabel}
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.bottom}>
            <Button
              key="find"
              type="button"
              className={styles.search}
              onClick={() =>
                window.open(
                  "https://sketchfab.com/search?features=downloadable&sort_by=-pertinence&type=models",
                  "_blank"
                )
              }
            >
              Search...
            </Button>
            <Button
              key="collections"
              type="button"
              className={styles.collections}
              onClick={() => window.open("https://sketchfab.com/mozillareality/collections", "_blank")}
            >
              Collections...
            </Button>
            <div style={{ flex: 10 }} />
            <Button key="cancel" type="button" onClick={this.props.onCancel} className={styles.cancel}>
              {this.props.cancelLabel}
            </Button>
            <Button {...okAttributes} key="ok" type="submit" onClick={this.onSubmit}>
              {this.props.okLabel}
            </Button>
          </div>
        </form>
      </div>
    );
  };
}
