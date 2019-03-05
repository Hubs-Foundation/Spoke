import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../inputs/Button";
import StringInput from "../inputs/StringInput";
import DialogHeader from "./DialogHeader";

export default class TextInputDialog extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    initialValue: PropTypes.string,
    okLabel: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    cancelLabel: PropTypes.string,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    okLabel: "Ok",
    cancelLabel: "Cancel"
  };

  constructor(props) {
    super(props);

    this.state = {
      value: props.initialValue || ""
    };
  }

  isValidInput() {
    return this.state.value !== "";
  }

  handleChange = value => {
    this.setState({ value });
  };

  onSubmit = e => {
    e.preventDefault();
    this.props.onConfirm(this.state.value);
  };

  render = () => {
    return (
      <div className={styles.dialogContainer}>
        <form>
          <DialogHeader title={this.props.title} />
          <div className={styles.content}>
            <div className={styles.contentRows}>
              <p>{this.props.message}</p>
              <div className={styles.fieldRow}>
                <StringInput value={this.state.value} onChange={this.handleChange} autoFocus />
              </div>
            </div>
          </div>
          <div className={styles.bottom}>
            <Button key="cancel" type="button" onClick={this.props.onCancel} className={styles.cancel}>
              {this.props.cancelLabel}
            </Button>
            <Button disabled={this.state.value.trim() === ""} key="ok" type="submit" onClick={this.onSubmit}>
              {this.props.okLabel}
            </Button>
          </div>
        </form>
      </div>
    );
  };
}
