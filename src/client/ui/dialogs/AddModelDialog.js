import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import classNames from "classnames";
import Button from "../Button";
import StringInput from "../inputs/StringInput";
import Header from "../Header";

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

  handleSubmit = e => {
    e.preventDefault();
    console.log("submit");
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

    if (!this.isValidURLEntered()) {
      okAttributes.disabled = true;
    }

    return (
      <div className={styles.dialogContainer}>
        <Header title={this.props.title} />
        <div className={styles.content}>
          <div className={styles.contentRows}>
            <p>{this.props.message}</p>
            <form onSubmit={this.handleSubmit}>
              <div className={styles.fieldRow}>
                <StringInput value={this.state.url} onChange={this.handleChange} autoFocus />
                <Button onClick={this.props.onFilePickerChosen}>{this.props.chooseFileLabel}</Button>
              </div>
            </form>
          </div>
        </div>
        <div className={styles.bottom}>
          <Button key="cancel" onClick={this.props.onCancel}>
            {this.props.cancelLabel}
          </Button>
          <Button {...okAttributes} key="ok" onClick={this.props.onURLEntered}>
            {this.props.okLabel}
          </Button>
        </div>
      </div>
    );
  };
}
