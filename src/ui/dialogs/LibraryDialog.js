import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryDialog.scss";
import DialogHeader from "./DialogHeader";
import Button from "../inputs/Button";

export default class LibraryDialog extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    component: PropTypes.elementType.isRequired,
    componentProps: PropTypes.object,
    onSelectItem: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired
  };

  onSelectItem = (NodeType, props) => {
    this.props.hideDialog();
    this.props.onSelectItem(NodeType, props);
  };

  onCancel = () => {
    this.props.hideDialog();
  };

  render = () => {
    const LibraryComponent = this.props.component;

    return (
      <div className={styles.libraryDialog}>
        <DialogHeader title={this.props.title} />
        <div className={styles.content}>
          <LibraryComponent
            onSelectItem={this.onSelectItem}
            tooltipId="library-dialog"
            {...this.props.componentProps}
          />
        </div>
        <div className={styles.bottom}>
          <Button className={styles.cancel} onClick={this.onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };
}
