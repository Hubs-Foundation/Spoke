import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../inputs/Button";
import StringInput from "../inputs/StringInput";
import DialogHeader from "./DialogHeader";

const DEFAULT_MEDIA_URL =
  "https://assets-prod.reticulum.io/assets/images/hub-preview-light-no-shadow-5ebb166e8580d819b445892173ec0286.png";

export default class AddMediaDialog extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    okLabel: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    cancelLabel: PropTypes.string,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    okLabel: "Add",
    cancelLabel: "Cancel"
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

  onSubmit = e => {
    e.preventDefault();
    this.props.onConfirm(this.state.url || DEFAULT_MEDIA_URL);
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
              </div>
            </div>
          </div>
          <div className={styles.bottom}>
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
