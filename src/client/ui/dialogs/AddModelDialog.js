import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import StringInput from "../inputs/StringInput";
import Header from "../Header";

const DEFAULT_OBJECT_URL = "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf";

export default class AddModelDialog extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    okLabel: PropTypes.string,
    onURLEntered: PropTypes.func.isRequired,
    cancelLabel: PropTypes.string,
    onCancel: PropTypes.func,
    onFilePickerChosen: PropTypes.func.isRequired,
    chooseFileLabel: PropTypes.string
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

  render = () => {
    const okAttributes = {};

    if (!this.isValidURLEntered() && this.state.url !== "") {
      okAttributes.disabled = true;
    }

    return (
      <div className={styles.dialogContainer}>
        <form>
          <Header title={this.props.title} />
          <div className={styles.content}>
            <div className={styles.contentRows}>
              <p>{this.props.message}</p>
              <div className={styles.fieldRow}>
                <StringInput value={this.state.url} onChange={this.handleChange} autoFocus />
                <Button type="button" onClick={this.props.onFilePickerChosen}>
                  {this.props.chooseFileLabel}
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.bottom}>
            <Button key="cancel" type="button" onClick={this.props.onCancel} className={styles.cancel}>
              {this.props.cancelLabel}
            </Button>
            <Button
              {...okAttributes}
              key="ok"
              type="submit"
              onClick={() => this.props.onURLEntered(this.state.url || DEFAULT_OBJECT_URL)}
            >
              {this.props.okLabel}
            </Button>
          </div>
        </form>
      </div>
    );
  };
}
