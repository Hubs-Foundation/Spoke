import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryInput.scss";
import StringInput from "./StringInput";
import Button from "./Button";
import { withDialog } from "../contexts/DialogContext";
import LibraryDialog from "../dialogs/LibraryDialog";

class LibraryInput extends Component {
  static propTypes = {
    dialogTitle: PropTypes.string.isRequired,
    component: PropTypes.elementType.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  static getDerivedStateFromProps(props, state) {
    if (props.value !== state.value) {
      return {
        value: props.value
      };
    }

    return null;
  }

  constructor(props) {
    super(props);

    this.state = {
      value: props.value
    };
  }

  onChange = value => {
    this.setState({ value });
  };

  onBlur = () => {
    this.props.onChange(this.state.value);
  };

  onOpenDialog = () => {
    this.props.showDialog(LibraryDialog, {
      title: this.props.dialogTitle,
      component: this.props.component,
      onSelectItem: this.onSelectItem
    });
  };

  onSelectItem = (NodeType, props) => {
    this.props.onChange(props.src);
  };

  render() {
    const { onChange, value, component, dialogTitle, showDialog, hideDialog, ...rest } = this.props;

    return (
      <div className={styles.libraryInput}>
        <StringInput {...rest} value={this.state.value} onChange={this.onChange} onBlur={this.onBlur} />
        <Button onClick={this.onOpenDialog}>Pick</Button>
      </div>
    );
  }
}

export default withDialog(LibraryInput);
